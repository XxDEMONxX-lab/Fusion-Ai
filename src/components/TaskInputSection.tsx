import React, { useState } from 'react';
import { Sparkles, Sliders, ArrowRight, Zap, Shield, GitMerge, Layers, MessageSquare, Check, HelpCircle } from 'lucide-react';
import { ExecutionMode, AutoSelectionPreferences } from '../types';

interface TaskInputSectionProps {
  task: string;
  setTask: (task: string) => void;
  adsAutoMode: boolean;
  setAdsAutoMode: (enabled: boolean) => void;
  executionMode: ExecutionMode;
  setExecutionMode: (mode: ExecutionMode) => void;
  preferences: AutoSelectionPreferences;
  setPreferences: React.Dispatch<React.SetStateAction<AutoSelectionPreferences>>;
  onAnalyzeAndSelect: () => void;
  isAnalyzing: boolean;
  hasApiKey: boolean;
  onOpenKeyModal: () => void;
}

export const TaskInputSection: React.FC<TaskInputSectionProps> = ({
  task,
  setTask,
  adsAutoMode,
  setAdsAutoMode,
  executionMode,
  setExecutionMode,
  preferences,
  setPreferences,
  onAnalyzeAndSelect,
  isAnalyzing,
  hasApiKey,
  onOpenKeyModal
}) => {
  const [showAdvancedBuilder, setShowAdvancedBuilder] = useState(false);
  const [objective, setObjective] = useState('');
  const [context, setContext] = useState('');
  const [requirements, setRequirements] = useState('');
  const [outputFormat, setOutputFormat] = useState('');
  const [customSynthesis, setCustomSynthesis] = useState('');

  const PREFERENCE_PRESETS = [
    'Use the best models for coding and architecture',
    'Choose affordable, cost-effective models',
    'Use fast models only with low latency',
    'Use at least four models from different providers',
    'Select one planner, one coder, one security reviewer, and one final synthesizer'
  ];

  const handleApplyPreset = (preset: string) => {
    setPreferences(prev => ({
      ...prev,
      naturalLanguagePreference: preset
    }));
  };

  const handleAssembleAdvancedPrompt = () => {
    const parts: string[] = [];
    if (objective.trim()) parts.push(`OBJECTIVE:\n${objective.trim()}`);
    if (context.trim()) parts.push(`CONTEXT / BACKGROUND:\n${context.trim()}`);
    if (requirements.trim()) parts.push(`REQUIREMENTS:\n${requirements.trim()}`);
    if (outputFormat.trim()) parts.push(`OUTPUT FORMAT:\n${outputFormat.trim()}`);
    if (customSynthesis.trim()) {
      setPreferences(prev => ({ ...prev, naturalLanguagePreference: prev.naturalLanguagePreference ? `${prev.naturalLanguagePreference}. Synthesis: ${customSynthesis.trim()}` : `Synthesis: ${customSynthesis.trim()}` }));
    }

    if (parts.length > 0) {
      setTask(parts.join('\n\n'));
    }
  };

  return (
    <div className="w-full space-y-5">
      {/* Top Banner with Mode & Ads Auto Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-neutral-800 bg-neutral-900/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-950/70 border border-purple-800/60 text-purple-400">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">Ads Auto Mode</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                adsAutoMode ? 'bg-purple-950/70 text-purple-300 border-purple-800/60' : 'bg-neutral-800 text-neutral-400 border-neutral-700'
              }`}>
                {adsAutoMode ? 'Autonomous Selection' : 'Manual Config'}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Dynamically evaluates task requirements, context length, pricing, and capability benchmarks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={adsAutoMode}
              onChange={(e) => setAdsAutoMode(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            <span className="ml-2.5 text-xs font-medium text-neutral-300">
              {adsAutoMode ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        </div>
      </div>

      {/* Execution Mode Selector */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-neutral-300">
            Multi-AI Execution Paradigm
          </label>
          <span className="text-xs text-neutral-500 font-mono">
            How models collaborate
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            {
              id: 'parallel',
              name: 'Parallel Mode',
              desc: 'Simultaneous multi-model response',
              icon: Zap
            },
            {
              id: 'specialist',
              name: 'Specialist Mode',
              desc: 'Dedicated roles per model',
              icon: Shield
            },
            {
              id: 'debate',
              name: 'Debate Mode',
              desc: 'Critique & cross-examination',
              icon: MessageSquare
            },
            {
              id: 'pipeline',
              name: 'Pipeline Mode',
              desc: 'Sequential refinement chain',
              icon: GitMerge
            }
          ].map((m) => {
            const Icon = m.icon;
            const isSelected = executionMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setExecutionMode(m.id as ExecutionMode)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'border-purple-500 bg-purple-950/20 text-white shadow-xs'
                    : 'border-neutral-800 bg-neutral-900/50 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${isSelected ? 'text-purple-400' : 'text-neutral-500'}`} />
                    <span className="text-xs font-semibold">{m.name}</span>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 text-purple-400" />}
                </div>
                <p className="text-[11px] text-neutral-500 line-clamp-1">
                  {m.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Task Input Box */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/80 p-5 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-white">
            What do you want the AIs to do?
          </label>
          <button
            type="button"
            onClick={() => setShowAdvancedBuilder(!showAdvancedBuilder)}
            className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors"
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>{showAdvancedBuilder ? 'Simple Task Box' : 'Advanced Prompt Builder'}</span>
          </button>
        </div>

        {/* Advanced Builder Accordion */}
        {showAdvancedBuilder ? (
          <div className="space-y-3 my-4 p-4 rounded-lg border border-neutral-800 bg-neutral-950/50">
            <div className="text-xs font-medium text-neutral-300 pb-1 border-b border-neutral-800/80">
              Structured Prompt Configuration
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Primary Objective</label>
                <input
                  type="text"
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  placeholder="e.g., Build a production Discord security bot"
                  className="w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-200 focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Context & Tech Stack</label>
                <input
                  type="text"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="e.g., Node 20+, Discord.js v14, TypeScript, Prisma"
                  className="w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-200 focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Specific Requirements & Constraints</label>
              <textarea
                rows={2}
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="e.g., Must include rate limit middleware, anti-spam heuristics, slash commands, audit log event emitter"
                className="w-full rounded-md border border-neutral-800 bg-neutral-900 p-2.5 text-xs text-neutral-200 focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Desired Output Format</label>
                <input
                  type="text"
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value)}
                  placeholder="e.g., Complete file structure and ready-to-run code files"
                  className="w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-200 focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Custom Synthesis Directives</label>
                <input
                  type="text"
                  value={customSynthesis}
                  onChange={(e) => setCustomSynthesis(e.target.value)}
                  placeholder="e.g., Verify code is resilient against race conditions"
                  className="w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-200 focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleAssembleAdvancedPrompt}
              className="text-xs font-medium text-purple-300 bg-purple-950/60 border border-purple-800/60 px-3 py-1.5 rounded-md hover:bg-purple-900/60 transition-colors"
            >
              Assemble into Task Box
            </button>
          </div>
        ) : null}

        <textarea
          rows={4}
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="Example: Create a Discord.js bot with moderation, ticket, logging, and security systems. Provide complete architectural structure and production code."
          className="w-full rounded-lg border border-neutral-800 bg-neutral-950 p-4 text-sm text-neutral-100 placeholder-neutral-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all font-sans leading-relaxed resize-y"
        />

        {/* Natural Language Selection Preferences (when Ads Auto Mode is enabled) */}
        {adsAutoMode && (
          <div className="mt-4 pt-4 border-t border-neutral-800/80">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-neutral-300">
                Auto-Selection Natural Language Preferences (Optional)
              </label>
              <span className="text-[11px] text-neutral-500 font-mono">
                Steers model selection
              </span>
            </div>
            <input
              type="text"
              value={preferences.naturalLanguagePreference}
              onChange={(e) =>
                setPreferences((prev) => ({
                  ...prev,
                  naturalLanguagePreference: e.target.value
                }))
              }
              placeholder="e.g., Use best models for coding, include a security specialist, prioritize quality"
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs text-neutral-200 placeholder-neutral-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
              <span className="text-[11px] text-neutral-500 mr-1">Presets:</span>
              {PREFERENCE_PRESETS.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="text-[11px] text-neutral-400 hover:text-purple-300 bg-neutral-800/70 hover:bg-neutral-800 border border-neutral-700/60 rounded px-2 py-0.5 transition-colors text-left"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 pt-3">
          <div className="text-xs text-neutral-500 flex items-center gap-1.5">
            {!hasApiKey ? (
              <span className="text-amber-400/90 flex items-center gap-1">
                <span>⚠️ OpenRouter API Key not connected.</span>
                <button
                  onClick={onOpenKeyModal}
                  className="underline hover:text-amber-300"
                >
                  Connect Key
                </button>
              </span>
            ) : (
              <span>Your request will be routed securely via OpenRouter.</span>
            )}
          </div>

          <button
            type="button"
            onClick={onAnalyzeAndSelect}
            disabled={!task.trim() || isAnalyzing}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm shadow-purple-600/30 transition-all active:scale-[0.98]"
          >
            {isAnalyzing ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Analyzing Task & Matching Capabilities...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Analyze & Match AI Models</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
