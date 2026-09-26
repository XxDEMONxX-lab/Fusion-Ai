import React from 'react';
import { Sparkles, Cpu, Layers, ArrowRight, Zap, Shield, Key, History, Activity, BarChart3, Database } from 'lucide-react';
import { TaskSession, ModelInfo } from '../types';

interface DashboardViewProps {
  isConnected: boolean;
  keyLabel?: string;
  onOpenKeyModal: () => void;
  onStartNewTask: (initialTask?: string, presetPreference?: string) => void;
  recentTasks: TaskSession[];
  availableModels: ModelInfo[];
  adsAutoMode: boolean;
  onToggleAutoMode: () => void;
  onReopenSession: (session: TaskSession) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  isConnected,
  keyLabel,
  onOpenKeyModal,
  onStartNewTask,
  recentTasks,
  availableModels,
  adsAutoMode,
  onToggleAutoMode,
  onReopenSession
}) => {
  // Aggregate stats
  const totalTasks = recentTasks.length;
  const totalTokens = recentTasks.reduce((acc, t) => {
    const modelsT = t.modelResults.reduce((mAcc, m) => mAcc + (m.tokenUsage?.totalTokens || 0), 0);
    const synthT = t.synthesisResult?.tokenUsage?.totalTokens || 0;
    return acc + modelsT + synthT;
  }, 0);

  const estimatedTotalCost = recentTasks.reduce((acc, t) => {
    // approx $0.03 per task on average
    return acc + 0.03;
  }, 0);

  const STARTER_PRESETS = [
    {
      title: 'Discord.js Security & Moderation Bot',
      task: 'Create a Discord.js v14 bot with moderation, ticket, logging, and security systems. Provide clean modular code architecture, anti-raid protections, and slash command handlers.',
      pref: 'Use best models for coding and include a dedicated security reviewer',
      category: 'Software Engineering & Security',
      models: ['Claude 3.5 Sonnet', 'GPT-4o', 'DeepSeek R1', 'Gemini 2.5 Pro']
    },
    {
      title: 'Full-Stack TypeScript Architecture Review',
      task: 'Design an end-to-end resilient event-driven microservices architecture for a real-time collaborative workspace with WebSocket sync and optimistic UI.',
      pref: 'Select one architect, one performance specialist, and one security auditor',
      category: 'System Architecture',
      models: ['Claude 3.5 Sonnet', 'DeepSeek V3', 'DeepSeek R1', 'Llama 3.3 70B']
    },
    {
      title: 'Multi-Perspective AI & Tech Research',
      task: 'Provide a rigorous technical comparative analysis of state-of-the-art inference scaling laws, test-time compute, and reinforcement learning reasoning models.',
      pref: 'Use at least four models from different providers for diverse analytical depth',
      category: 'Deep Research & Synthesis',
      models: ['Claude 3.5 Sonnet', 'GPT-4o', 'Gemini 2.5 Pro', 'DeepSeek R1']
    }
  ];

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Hero Banner */}
      <div className="rounded-2xl border border-neutral-800 bg-gradient-to-b from-neutral-900 via-neutral-900/90 to-neutral-950 p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-800/50 text-purple-300 text-xs font-mono mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            <span>One Task → Multiple AI Specialists → One Master Answer</span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            AI Fusion Hub
          </h1>
          <p className="text-sm text-neutral-400 mt-2 leading-relaxed">
            Orchestrate leading AI models simultaneously via OpenRouter. Ads Auto Mode autonomously matches task requirements to specialized roles—planner, implementation engineer, security auditor, and synthesis AI.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              onClick={() => onStartNewTask()}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-sm shadow-purple-600/30 transition-all active:scale-[0.98]"
            >
              <Zap className="h-4 w-4" />
              <span>Launch New Task</span>
            </button>

            <button
              onClick={onOpenKeyModal}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-colors"
            >
              <Key className="h-3.5 w-3.5 text-purple-400" />
              <span>{isConnected ? `Key: ${keyLabel || 'Connected'}` : 'Connect OpenRouter Key'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Ads Auto Mode</span>
            <span className={`h-2 w-2 rounded-full ${adsAutoMode ? 'bg-purple-400 animate-pulse' : 'bg-neutral-600'}`} />
          </div>
          <div className="text-lg font-bold text-white mt-2">
            {adsAutoMode ? 'Active (Auto)' : 'Manual Mode'}
          </div>
          <button
            onClick={onToggleAutoMode}
            className="text-[11px] text-purple-400 hover:text-purple-300 mt-1 block font-mono"
          >
            Toggle setting →
          </button>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Multi-AI Tasks</span>
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-white mt-2 font-mono tabular-nums">
            {totalTasks} Executed
          </div>
          <div className="text-[11px] text-neutral-500 font-mono mt-1">
            Persisted in history
          </div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Synthesized Tokens</span>
            <BarChart3 className="h-3.5 w-3.5 text-indigo-400" />
          </div>
          <div className="text-lg font-bold text-white mt-2 font-mono tabular-nums">
            {totalTokens > 0 ? totalTokens.toLocaleString() : '0'}
          </div>
          <div className="text-[11px] text-neutral-500 font-mono mt-1">
            Across all models
          </div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Live Models</span>
            <Database className="h-3.5 w-3.5 text-purple-400" />
          </div>
          <div className="text-lg font-bold text-white mt-2 font-mono tabular-nums">
            {availableModels.length} Discovered
          </div>
          <div className="text-[11px] text-neutral-500 font-mono mt-1">
            OpenRouter dynamic catalog
          </div>
        </div>
      </div>

      {/* Starter Workflow Presets */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-white">
              Recommended Multi-Model Workflows
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Launch pre-configured tasks designed to demonstrate multi-model division of labor
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {STARTER_PRESETS.map((p, i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/70 hover:border-neutral-700 transition-all flex flex-col justify-between group"
            >
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                  {p.category}
                </span>
                <h3 className="text-sm font-semibold text-white mt-2 group-hover:text-purple-300 transition-colors">
                  {p.title}
                </h3>
                <p className="text-xs text-neutral-400 mt-1.5 line-clamp-2 leading-relaxed">
                  {p.task}
                </p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {p.models.map((m, idx) => (
                    <span key={idx} className="text-[10px] text-neutral-500 bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800/80 font-mono">
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onStartNewTask(p.task, p.pref)}
                className="mt-4 flex items-center justify-between w-full pt-3 border-t border-neutral-800/80 text-xs font-medium text-purple-400 group-hover:text-purple-300 transition-colors"
              >
                <span>Run with Auto-Selection</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Tasks List */}
      {recentTasks.length > 0 && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <h2 className="text-sm font-semibold text-white">Recent Multi-AI Tasks</h2>
            <span className="text-xs text-neutral-500 font-mono">Showing last {Math.min(recentTasks.length, 5)}</span>
          </div>

          <div className="divide-y divide-neutral-800/60 mt-2">
            {recentTasks.slice(0, 5).map((t) => (
              <div
                key={t.id}
                onClick={() => onReopenSession(t)}
                className="py-3 flex items-center justify-between gap-3 hover:bg-neutral-800/30 px-2 rounded-lg cursor-pointer transition-colors"
              >
                <div className="min-w-0">
                  <div className="text-xs font-medium text-neutral-200 truncate">
                    {t.title || t.task}
                  </div>
                  <div className="text-[11px] text-neutral-500 font-mono mt-0.5 flex items-center gap-2">
                    <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                    <span>·</span>
                    <span>{t.modelResults.length} Models</span>
                    <span>·</span>
                    <span className="capitalize">{t.mode}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs text-purple-400 shrink-0">
                  <span>View</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
