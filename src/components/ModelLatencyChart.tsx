import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  ReferenceLine
} from 'recharts';
import { Timer, Zap, AlertTriangle, CheckCircle2, TrendingUp, Layers, Info } from 'lucide-react';
import { ModelResult, SynthesisResult } from '../types';

interface ModelLatencyChartProps {
  modelResults: ModelResult[];
  synthesisResult?: SynthesisResult;
  title?: string;
  subtitle?: string;
  showRecommendations?: boolean;
}

interface LatencyDataPoint {
  id: string;
  name: string;
  fullName: string;
  role: string;
  provider: string;
  durationMs: number;
  durationSec: number;
  tokens: number;
  tokensPerSec: number;
  status: string;
  isBottleneck: boolean;
  isFastest: boolean;
  isSynthesis: boolean;
}

export const ModelLatencyChart: React.FC<ModelLatencyChartProps> = ({
  modelResults,
  synthesisResult,
  title = 'Model Latency & Performance Breakdown',
  subtitle = 'Identify execution bottlenecks across your orchestrated model mix',
  showRecommendations = true
}) => {
  const [unit, setUnit] = useState<'seconds' | 'ms'>('seconds');
  const [includeSynthesis, setIncludeSynthesis] = useState(true);

  // Prepare chart data
  const rawList: {
    id: string;
    name: string;
    role: string;
    provider: string;
    durationMs: number;
    tokens: number;
    status: string;
    isSynthesis: boolean;
  }[] = [];

  modelResults.forEach((m) => {
    // Fallback duration if missing (e.g. 1500ms default for mock or rapid execution)
    const dur = m.durationMs && m.durationMs > 0 ? m.durationMs : (m.status === 'completed' ? 2400 : 0);
    rawList.push({
      id: m.modelId,
      name: m.modelName.replace('Instruct', '').replace('Anthropic', '').trim(),
      role: m.roleName,
      provider: m.provider,
      durationMs: dur,
      tokens: m.tokenUsage?.completionTokens || m.tokenUsage?.totalTokens || 0,
      status: m.status,
      isSynthesis: false
    });
  });

  if (includeSynthesis && synthesisResult && synthesisResult.status === 'completed') {
    const synthDur = synthesisResult.durationMs && synthesisResult.durationMs > 0 ? synthesisResult.durationMs : 3100;
    rawList.push({
      id: synthesisResult.synthesisModelId,
      name: `${synthesisResult.synthesisModelName} (Synthesis)`,
      role: 'Lead Synthesizer',
      provider: 'Synthesis',
      durationMs: synthDur,
      tokens: synthesisResult.tokenUsage?.completionTokens || synthesisResult.tokenUsage?.totalTokens || 0,
      status: synthesisResult.status,
      isSynthesis: true
    });
  }

  if (rawList.length === 0) {
    return (
      <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-900/60 text-center text-xs text-neutral-400">
        No execution duration metrics recorded yet.
      </div>
    );
  }

  // Determine fastest and bottleneck (slowest) models
  const validDurations = rawList.filter(d => d.durationMs > 0);
  const maxDuration = validDurations.length > 0 ? Math.max(...validDurations.map(d => d.durationMs)) : 0;
  const minDuration = validDurations.length > 0 ? Math.min(...validDurations.map(d => d.durationMs)) : 0;
  const avgDurationMs = validDurations.length > 0
    ? validDurations.reduce((acc, d) => acc + d.durationMs, 0) / validDurations.length
    : 0;

  const data: LatencyDataPoint[] = rawList.map((item) => {
    const isBottleneck = item.durationMs === maxDuration && validDurations.length > 1;
    const isFastest = item.durationMs === minDuration && validDurations.length > 1;
    const durationSec = Number((item.durationMs / 1000).toFixed(2));
    const tokensPerSec = durationSec > 0 && item.tokens > 0 ? Math.round(item.tokens / durationSec) : 0;

    return {
      ...item,
      fullName: item.name,
      durationSec,
      tokensPerSec,
      isBottleneck,
      isFastest
    };
  });

  const bottleneckModel = data.find(d => d.isBottleneck);
  const fastestModel = data.find(d => d.isFastest);

  // Parallel efficiency calculation
  const totalSequentialMs = rawList.reduce((acc, m) => acc + m.durationMs, 0);
  const wallClockMs = maxDuration;
  const parallelSavingsRatio = totalSequentialMs > wallClockMs
    ? ((totalSequentialMs - wallClockMs) / totalSequentialMs) * 100
    : 0;

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d: LatencyDataPoint = payload[0].payload;
      return (
        <div className="rounded-xl border border-neutral-700 bg-neutral-950/95 p-3.5 shadow-2xl backdrop-blur-md max-w-xs text-xs space-y-1.5 z-50">
          <div className="flex items-center justify-between gap-2 border-b border-neutral-800 pb-1.5">
            <span className="font-semibold text-white truncate">{d.fullName}</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300">
              {d.provider}
            </span>
          </div>
          <div className="text-[11px] text-purple-300 font-medium">
            Role: {d.role}
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
            <div>
              <span className="text-neutral-400 block text-[10px]">Latency</span>
              <span className="text-white font-semibold">
                {d.durationSec}s <span className="text-neutral-500 font-normal">({d.durationMs.toLocaleString()} ms)</span>
              </span>
            </div>
            <div>
              <span className="text-neutral-400 block text-[10px]">Output Tokens</span>
              <span className="text-white font-semibold">
                {d.tokens > 0 ? d.tokens.toLocaleString() : 'N/A'}
              </span>
            </div>
          </div>
          {d.tokensPerSec > 0 && (
            <div className="text-[11px] font-mono text-emerald-400 pt-0.5">
              Speed: ~{d.tokensPerSec} tokens/sec
            </div>
          )}
          {d.isBottleneck && (
            <div className="flex items-center gap-1 text-[11px] text-amber-400 pt-1 border-t border-neutral-800 font-medium">
              <AlertTriangle className="h-3 w-3" />
              <span>Critical Path Bottleneck</span>
            </div>
          )}
          {d.isFastest && (
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 pt-1 border-t border-neutral-800 font-medium">
              <Zap className="h-3 w-3" />
              <span>Fastest in selected mix</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/80 p-5 shadow-xl space-y-5">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-white">{title}</h3>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">{subtitle}</p>
        </div>

        {/* Units and Filter toggles */}
        <div className="flex items-center gap-2 text-xs">
          {synthesisResult && (
            <label className="flex items-center gap-1.5 text-neutral-400 hover:text-neutral-200 cursor-pointer text-[11px] mr-2">
              <input
                type="checkbox"
                checked={includeSynthesis}
                onChange={(e) => setIncludeSynthesis(e.target.checked)}
                className="rounded border-neutral-700 bg-neutral-800 text-purple-600 focus:ring-0"
              />
              <span>Include Synthesizer</span>
            </label>
          )}

          <div className="inline-flex rounded-lg border border-neutral-800 bg-neutral-950 p-0.5">
            <button
              type="button"
              onClick={() => setUnit('seconds')}
              className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors ${
                unit === 'seconds' ? 'bg-purple-600 text-white font-semibold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Seconds (s)
            </button>
            <button
              type="button"
              onClick={() => setUnit('ms')}
              className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors ${
                unit === 'ms' ? 'bg-purple-600 text-white font-semibold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Milliseconds (ms)
            </button>
          </div>
        </div>
      </div>

      {/* Latency Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg border border-neutral-800/80 bg-neutral-950/60">
          <div className="text-[11px] text-neutral-400 font-mono flex items-center justify-between">
            <span>Critical Bottleneck</span>
            <AlertTriangle className="h-3 w-3 text-amber-400" />
          </div>
          <div className="text-sm font-semibold text-amber-300 mt-1 truncate">
            {bottleneckModel ? bottleneckModel.name : 'Balanced'}
          </div>
          <div className="text-[11px] font-mono text-neutral-400 mt-0.5">
            {bottleneckModel ? `${bottleneckModel.durationSec}s (${bottleneckModel.durationMs}ms)` : 'Uniform speed'}
          </div>
        </div>

        <div className="p-3 rounded-lg border border-neutral-800/80 bg-neutral-950/60">
          <div className="text-[11px] text-neutral-400 font-mono flex items-center justify-between">
            <span>Fastest Model</span>
            <Zap className="h-3 w-3 text-emerald-400" />
          </div>
          <div className="text-sm font-semibold text-emerald-300 mt-1 truncate">
            {fastestModel ? fastestModel.name : 'N/A'}
          </div>
          <div className="text-[11px] font-mono text-neutral-400 mt-0.5">
            {fastestModel ? `${fastestModel.durationSec}s (${fastestModel.durationMs}ms)` : 'N/A'}
          </div>
        </div>

        <div className="p-3 rounded-lg border border-neutral-800/80 bg-neutral-950/60">
          <div className="text-[11px] text-neutral-400 font-mono flex items-center justify-between">
            <span>Average Model Latency</span>
            <TrendingUp className="h-3 w-3 text-purple-400" />
          </div>
          <div className="text-sm font-semibold text-white mt-1 font-mono tabular-nums">
            {(avgDurationMs / 1000).toFixed(2)}s
          </div>
          <div className="text-[11px] font-mono text-neutral-500 mt-0.5">
            {Math.round(avgDurationMs)} ms mean
          </div>
        </div>

        <div className="p-3 rounded-lg border border-neutral-800/80 bg-neutral-950/60">
          <div className="text-[11px] text-neutral-400 font-mono flex items-center justify-between">
            <span>Parallel Efficiency</span>
            <Layers className="h-3 w-3 text-indigo-400" />
          </div>
          <div className="text-sm font-semibold text-indigo-300 mt-1 font-mono tabular-nums">
            {parallelSavingsRatio > 0 ? `~${Math.round(parallelSavingsRatio)}% saved` : 'Standard'}
          </div>
          <div className="text-[11px] font-mono text-neutral-500 mt-0.5">
            vs sequential execution
          </div>
        </div>
      </div>

      {/* Main Recharts Bar Chart Container */}
      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 20, left: 10, bottom: 40 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#737373"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#404040' }}
              interval={0}
              angle={-20}
              textAnchor="end"
              height={50}
            />
            <YAxis
              stroke="#737373"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#404040' }}
              tickFormatter={(val) => (unit === 'seconds' ? `${val}s` : `${val}ms`)}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={unit === 'seconds' ? Number((avgDurationMs / 1000).toFixed(2)) : avgDurationMs}
              stroke="#a855f7"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `Mean: ${unit === 'seconds' ? (avgDurationMs / 1000).toFixed(1) + 's' : Math.round(avgDurationMs) + 'ms'}`,
                fill: '#c084fc',
                fontSize: 10,
                position: 'top'
              }}
            />
            <Bar
              dataKey={unit === 'seconds' ? 'durationSec' : 'durationMs'}
              radius={[6, 6, 0, 0]}
              animationDuration={800}
            >
              {data.map((entry, index) => {
                let barColor = '#8b5cf6'; // Default purple
                if (entry.isBottleneck) {
                  barColor = '#f59e0b'; // Amber warning for bottleneck
                } else if (entry.isFastest) {
                  barColor = '#10b981'; // Emerald for fastest
                } else if (entry.isSynthesis) {
                  barColor = '#6366f1'; // Indigo for synthesis
                }
                return <Cell key={`cell-${index}`} fill={barColor} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono pt-1 text-neutral-400 border-t border-neutral-800/80">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-amber-500 inline-block" />
          <span>Bottleneck Model (Critical Path)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-emerald-500 inline-block" />
          <span>Fastest Model</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-purple-500 inline-block" />
          <span>Standard Specialist</span>
        </div>
        {includeSynthesis && (
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-indigo-500 inline-block" />
            <span>Synthesis AI</span>
          </div>
        )}
      </div>

      {/* Actionable Bottleneck Recommendations */}
      {showRecommendations && bottleneckModel && (
        <div className="rounded-lg border border-amber-900/40 bg-amber-950/20 p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
            <Info className="h-4 w-4 shrink-0" />
            <span>Bottleneck Optimization Advisory</span>
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed">
            <strong className="text-white">{bottleneckModel.fullName}</strong> was the bottleneck on your critical path, requiring{' '}
            <strong className="text-amber-300">{bottleneckModel.durationSec}s</strong> ({Math.round(((bottleneckModel.durationMs - avgDurationMs) / avgDurationMs) * 100)}% slower than average).
            {bottleneckModel.id.includes('r1') ? (
              <span> Deep reasoning models deliberate extensively over token chains. To optimize overall pipeline throughput, keep deep reasoners for security/audit stages and use high-throughput models (e.g. Gemini 2.5 Flash, DeepSeek V3) for rapid implementations.</span>
            ) : (
              <span> You can swap this role in Ads Auto Mode settings for high-speed alternatives like Gemini 2.5 Flash, or switch from Sequential Pipeline to Parallel Mode to execute models concurrently.</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
};
