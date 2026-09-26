import React, { useState } from 'react';
import { Sparkles, Copy, Check, Download, RefreshCw, Layers, CheckCircle2, ChevronRight, Eye, Code2, AlertTriangle, ArrowLeft, BarChart3, Timer, Zap } from 'lucide-react';
import { TaskSession } from '../types';
import { ModelLatencyChart } from './ModelLatencyChart';

interface FinalAnswerViewProps {
  session: TaskSession;
  onRegenerateSynthesis: () => void;
  onRetryFailedModels: () => void;
  onBackToConsole: () => void;
  onStartNewTask: () => void;
}

export const FinalAnswerView: React.FC<FinalAnswerViewProps> = ({
  session,
  onRegenerateSynthesis,
  onRetryFailedModels,
  onBackToConsole,
  onStartNewTask
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'synthesis' | 'comparison' | 'performance' | 'reasoning'>('synthesis');
  const [selectedInspectModel, setSelectedInspectModel] = useState<string>(
    session.modelResults[0]?.modelId || ''
  );

  const finalAnswer = session.synthesisResult?.finalAnswer || 'No combined answer available.';
  const failedModels = session.modelResults.filter(m => m.status === 'failed');

  const totalTokens = (session.modelResults.reduce((acc, m) => acc + (m.tokenUsage?.totalTokens || 0), 0)) +
    (session.synthesisResult?.tokenUsage?.totalTokens || 0);

  const handleCopy = () => {
    navigator.clipboard.writeText(finalAnswer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([
      `# AI Fusion Hub — Final Synthesized Solution\n\n` +
      `**Task:** ${session.task}\n\n` +
      `**Execution Date:** ${new Date(session.createdAt).toLocaleString()}\n\n` +
      `**Models Orchestrated:** ${session.modelResults.map(m => `${m.modelName} (${m.roleName})`).join(', ')}\n\n` +
      `**Synthesis Model:** ${session.synthesisResult?.synthesisModelName || 'Lead Synthesizer'}\n\n` +
      `---\n\n` +
      `${finalAnswer}`
    ], { type: 'text/markdown;charset=utf-8' });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-fusion-${session.id.slice(0, 8)}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl border border-neutral-800 bg-neutral-900/90 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-emerald-400 font-semibold tracking-wider">
              COMBINED SYNTHESIS COMPLETE
            </span>
            <span className="text-xs text-neutral-500">·</span>
            <span className="text-xs text-neutral-400 font-mono">
              {session.modelResults.filter(m => m.status === 'completed').length} Models Unified
            </span>
          </div>
          <h2 className="font-display text-xl font-bold text-white mt-1">
            Definitive Solution Deliverable
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5 line-clamp-1">
            Task: {session.task}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onBackToConsole}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Model Responses</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg border border-neutral-700 transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-300">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Answer</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg border border-neutral-700 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download .MD</span>
          </button>

          <button
            type="button"
            onClick={onRegenerateSynthesis}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-purple-300 bg-purple-950/70 hover:bg-purple-900/80 border border-purple-800/60 rounded-lg transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Regenerate Synthesis</span>
          </button>

          <button
            type="button"
            onClick={onStartNewTask}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-sm shadow-purple-600/30 transition-all active:scale-[0.98]"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Model Roster & Synthesis Metadata Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3.5">
          <div className="text-[11px] font-mono text-neutral-400">Synthesizer Model</div>
          <div className="text-sm font-semibold text-white mt-1 truncate">
            {session.synthesisResult?.synthesisModelName || session.plan?.synthesisModel?.modelName || 'Claude 3.5 Sonnet'}
          </div>
          <div className="text-[11px] text-purple-400 font-mono mt-0.5">
            Role: Lead Integrator
          </div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3.5">
          <div className="text-[11px] font-mono text-neutral-400">Collaborating Models</div>
          <div className="text-sm font-semibold text-white mt-1">
            {session.modelResults.length} AI Specialists
          </div>
          <div className="text-[11px] text-neutral-400 font-mono mt-0.5 truncate">
            {session.modelResults.map(m => m.modelName).join(', ')}
          </div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3.5">
          <div className="text-[11px] font-mono text-neutral-400">Total Tokens Processed</div>
          <div className="text-sm font-semibold text-white mt-1 font-mono tabular-nums">
            {totalTokens.toLocaleString()} Tokens
          </div>
          <div className="text-[11px] text-emerald-400 font-mono mt-0.5">
            Est. Cost: {session.plan?.estimatedCost || '< $0.05'}
          </div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3.5">
          <div className="text-[11px] font-mono text-neutral-400">Execution Mode</div>
          <div className="text-sm font-semibold text-white mt-1 capitalize">
            {session.mode} Mode
          </div>
          <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
            Ads Auto Mode: {session.adsAutoMode ? 'Active' : 'Custom'}
          </div>
        </div>
      </div>

      {/* Failed Models Notice (if any) */}
      {failedModels.length > 0 && (
        <div className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
            <div className="text-xs text-neutral-300">
              <span className="font-semibold text-amber-300">{failedModels.length} model(s) failed</span> during execution. Synthesis proceeded with all successful models.
            </div>
          </div>
          <button
            type="button"
            onClick={onRetryFailedModels}
            className="flex items-center gap-1.5 px-3 py-1 text-xs text-amber-300 hover:text-white bg-amber-950/70 border border-amber-800/80 rounded-lg transition-colors shrink-0"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Retry Failed Models</span>
          </button>
        </div>
      )}

      {/* View Segment Tabs */}
      <div className="flex items-center gap-1 p-1 bg-neutral-900/90 border border-neutral-800 rounded-lg w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('synthesis')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
            activeTab === 'synthesis'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Final Synthesized Solution</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('comparison')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
            activeTab === 'comparison'
              ? 'bg-neutral-800 text-white shadow-xs'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Code2 className="h-3.5 w-3.5" />
          <span>Inspect Individual AI Responses</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('performance')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
            activeTab === 'performance'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <BarChart3 className="h-3.5 w-3.5" />
          <span>Performance & Bottlenecks</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reasoning')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
            activeTab === 'reasoning'
              ? 'bg-neutral-800 text-white shadow-xs'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Model Selection Reasoning</span>
        </button>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'synthesis' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/80 p-6 shadow-xl">
            <div className="prose prose-invert max-w-none text-sm text-neutral-200 leading-relaxed font-sans whitespace-pre-wrap selection:bg-purple-500/30">
              {finalAnswer}
            </div>
          </div>

          {/* Quick Latency Benchmark Jump Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-neutral-800/80 bg-neutral-900/60 text-xs">
            <div className="flex items-center gap-2 text-neutral-300">
              <Timer className="h-4 w-4 text-purple-400 shrink-0" />
              <span>
                Want to analyze which model was your latency bottleneck?
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('performance')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-purple-300 hover:text-white border border-neutral-700 font-mono text-[11px] transition-colors w-fit"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Inspect Duration Bar Chart →</span>
            </button>
          </div>
        </div>
      )}

      {activeTab === 'performance' && (
        <ModelLatencyChart
          modelResults={session.modelResults}
          synthesisResult={session.synthesisResult}
        />
      )}

      {activeTab === 'comparison' && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/80 p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-neutral-800">
            {session.modelResults.map(m => (
              <button
                key={m.modelId}
                onClick={() => setSelectedInspectModel(m.modelId)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  selectedInspectModel === m.modelId
                    ? 'bg-purple-600 text-white'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                {m.modelName} ({m.roleName})
              </button>
            ))}
          </div>

          {(() => {
            const inspected = session.modelResults.find(m => m.modelId === selectedInspectModel) || session.modelResults[0];
            if (!inspected) return <div>No model result found.</div>;
            return (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-neutral-400 font-mono pb-2 border-b border-neutral-800/80">
                  <span>Provider: {inspected.provider} · Role: {inspected.roleName}</span>
                  <span>Tokens: {inspected.tokenUsage?.totalTokens.toLocaleString() || 'N/A'} · Duration: {inspected.durationMs ? `${(inspected.durationMs / 1000).toFixed(1)}s` : 'N/A'}</span>
                </div>
                <div className="p-4 rounded-lg bg-neutral-950/70 border border-neutral-800 text-xs text-neutral-200 font-sans whitespace-pre-wrap leading-relaxed">
                  {inspected.response || inspected.error || 'No output recorded.'}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {activeTab === 'reasoning' && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/80 p-6 shadow-xl space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-white mb-2">
              Ads Auto Mode Decision Architecture
            </h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              {session.plan?.selectionReasoning || 'Ads Auto Mode matched models dynamically against performance benchmarks and task complexity.'}
            </p>
          </div>

          <div className="space-y-3 pt-3 border-t border-neutral-800">
            <h4 className="text-xs font-semibold text-neutral-300">
              Assigned Specialist Rationale:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {session.plan?.selectedModels.map((m, i) => (
                <div key={i} className="p-3 rounded-lg border border-neutral-800 bg-neutral-950/60">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-white">{m.modelName}</span>
                    <span className="text-[11px] font-mono text-purple-400">{m.roleName}</span>
                  </div>
                  <p className="text-xs text-neutral-400 italic">"{m.reason}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
