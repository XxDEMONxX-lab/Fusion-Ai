import React, { useState } from 'react';
import { Loader2, CheckCircle2, AlertCircle, RefreshCw, Clock, Coins, Sparkles, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { ModelResult, SynthesisResult } from '../types';

interface ExecutionConsoleProps {
  modelResults: ModelResult[];
  synthesisResult?: SynthesisResult;
  isExecutingModels: boolean;
  isSynthesizing: boolean;
  onRetryModel: (modelId: string) => void;
  onProceedToSynthesis: () => void;
  onViewFinalAnswer: () => void;
}

export const ExecutionConsole: React.FC<ExecutionConsoleProps> = ({
  modelResults,
  synthesisResult,
  isExecutingModels,
  isSynthesizing,
  onRetryModel,
  onProceedToSynthesis,
  onViewFinalAnswer
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const completedCount = modelResults.filter(m => m.status === 'completed').length;
  const failedCount = modelResults.filter(m => m.status === 'failed').length;
  const totalCount = modelResults.length;
  const allFinished = !isExecutingModels && (completedCount + failedCount === totalCount);

  const handleCopyResponse = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Execution Status Bar */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/90 p-4 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-800 border border-neutral-700/80 text-neutral-200">
            {isExecutingModels ? (
              <Loader2 className="h-5 w-5 text-purple-400 animate-spin" />
            ) : isSynthesizing ? (
              <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" />
            ) : allFinished ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            ) : (
              <Clock className="h-5 w-5 text-neutral-400" />
            )}
          </div>

          <div>
            <div className="text-sm font-semibold text-white flex items-center gap-2">
              {isExecutingModels ? (
                <span>Executing Multi-AI Collaboration...</span>
              ) : isSynthesizing ? (
                <span>Synthesizing Final Master Answer...</span>
              ) : synthesisResult?.status === 'completed' ? (
                <span>Multi-AI Orchestration & Synthesis Complete</span>
              ) : (
                <span>Model Analysis Completed</span>
              )}
            </div>
            <div className="text-xs text-neutral-400 mt-0.5 flex items-center gap-2 font-mono">
              <span>{completedCount}/{totalCount} Models Succeeded</span>
              {failedCount > 0 && <span className="text-rose-400">· {failedCount} Failed</span>}
            </div>
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2">
          {allFinished && !isSynthesizing && !synthesisResult?.finalAnswer && (
            <button
              type="button"
              onClick={onProceedToSynthesis}
              disabled={completedCount === 0}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-sm shadow-purple-600/30 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              <span>Synthesize Solutions Now</span>
            </button>
          )}

          {synthesisResult?.finalAnswer && (
            <button
              type="button"
              onClick={onViewFinalAnswer}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm shadow-emerald-600/30 transition-all active:scale-[0.98]"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>View Final Combined Answer</span>
            </button>
          )}
        </div>
      </div>

      {/* Synthesis Progress Card (if synthesizing) */}
      {isSynthesizing && (
        <div className="rounded-xl border border-indigo-500/50 bg-indigo-950/20 p-5 shadow-lg animate-pulse">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 text-indigo-400 animate-spin" />
            <div>
              <div className="text-sm font-semibold text-white">
                Final Synthesis Model ({synthesisResult?.synthesisModelName || 'Lead Synthesizer'}) in Action
              </div>
              <p className="text-xs text-indigo-300/80 mt-0.5">
                Comparing all {completedCount} AI solutions, removing redundant suggestions, reconciling conflicting advice, and formatting the single master result.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Individual Model Result Panels */}
      <div className="grid grid-cols-1 gap-4">
        {modelResults.map((result, idx) => {
          const isExpanded = expandedIndex === idx;
          return (
            <div
              key={result.modelId}
              className={`rounded-xl border transition-all ${
                result.status === 'completed'
                  ? 'border-neutral-800 bg-neutral-900/80'
                  : result.status === 'failed'
                  ? 'border-rose-900/60 bg-rose-950/20'
                  : 'border-purple-900/50 bg-neutral-900/50'
              }`}
            >
              {/* Header */}
              <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800/80">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      result.status === 'completed'
                        ? 'bg-emerald-950 border border-emerald-800/60 text-emerald-400'
                        : result.status === 'failed'
                        ? 'bg-rose-950 border border-rose-800/60 text-rose-400'
                        : 'bg-purple-950 border border-purple-800/60 text-purple-400'
                    }`}
                  >
                    {result.status === 'completed' && <CheckCircle2 className="h-4 w-4" />}
                    {result.status === 'failed' && <AlertCircle className="h-4 w-4" />}
                    {result.status === 'running' && <Loader2 className="h-4 w-4 animate-spin" />}
                    {result.status === 'pending' && <Clock className="h-4 w-4" />}
                    {result.status === 'retrying' && <RefreshCw className="h-4 w-4 animate-spin" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">
                        {result.modelName}
                      </span>
                      <span className="text-xs text-neutral-500">·</span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-neutral-800 text-purple-300">
                        {result.roleName}
                      </span>
                      <span className="text-[11px] text-neutral-500 font-mono">
                        ({result.provider})
                      </span>
                    </div>

                    <div className="text-[11px] text-neutral-400 flex items-center gap-3 mt-1 font-mono">
                      <span>Status: <strong className="text-neutral-300 capitalize">{result.status}</strong></span>
                      {result.durationMs && (
                        <span>· {(result.durationMs / 1000).toFixed(1)}s</span>
                      )}
                      {result.tokenUsage && (
                        <span>· {result.tokenUsage.totalTokens.toLocaleString()} tokens</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  {result.status === 'failed' && (
                    <button
                      type="button"
                      onClick={() => onRetryModel(result.modelId)}
                      className="flex items-center gap-1.5 px-3 py-1 text-xs text-rose-300 hover:text-white bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 rounded-lg transition-colors"
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span>Retry Model</span>
                    </button>
                  )}

                  {result.status === 'completed' && result.response && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleCopyResponse(result.response || '', idx)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs text-neutral-400 hover:text-neutral-200 bg-neutral-800 rounded-lg transition-colors"
                        title="Copy Response"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs text-neutral-400 hover:text-neutral-200 bg-neutral-800 rounded-lg transition-colors"
                      >
                        <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="p-4 text-xs text-neutral-200 leading-relaxed font-sans">
                {result.status === 'running' && (
                  <div className="py-6 flex items-center justify-center gap-2 text-neutral-400">
                    <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                    <span>Analyzing domain requirements and formulating specialized perspective...</span>
                  </div>
                )}

                {result.status === 'failed' && (
                  <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs">
                    <p className="font-semibold mb-1">Execution Error:</p>
                    <p className="font-mono text-[11px]">{result.error || 'Failed to receive completion from model.'}</p>
                    <p className="text-[11px] text-rose-400/80 mt-2">
                      Other models will continue unaffected. You can retry this model with the button above.
                    </p>
                  </div>
                )}

                {result.status === 'completed' && (
                  <div>
                    <div
                      className={`whitespace-pre-wrap font-sans text-neutral-300 ${
                        !isExpanded ? 'line-clamp-6' : ''
                      }`}
                    >
                      {result.response}
                    </div>
                    {!isExpanded && (result.response?.length || 0) > 400 && (
                      <button
                        onClick={() => setExpandedIndex(idx)}
                        className="text-purple-400 hover:text-purple-300 text-xs mt-2 block font-medium"
                      >
                        Read full response →
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
