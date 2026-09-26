import React from 'react';
import { Cpu, Search, CheckCircle, Network, Layers, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

export type PipelineStage = 'input' | 'analysis' | 'selection' | 'confirmation' | 'executing' | 'synthesizing' | 'completed';

interface VisualPipelineProps {
  currentStage: PipelineStage;
  activeModelCount?: number;
  completedModelCount?: number;
}

export const VisualPipeline: React.FC<VisualPipelineProps> = ({
  currentStage,
  activeModelCount = 4,
  completedModelCount = 0
}) => {
  const steps = [
    {
      id: 'analysis',
      title: 'Task Analysis',
      subtitle: 'Intent & Requirements',
      icon: Search,
      isActive: currentStage === 'analysis',
      isCompleted: ['selection', 'confirmation', 'executing', 'synthesizing', 'completed'].includes(currentStage)
    },
    {
      id: 'selection',
      title: 'Capability Matching',
      subtitle: 'Ads Auto Mode',
      icon: Cpu,
      isActive: currentStage === 'selection',
      isCompleted: ['confirmation', 'executing', 'synthesizing', 'completed'].includes(currentStage)
    },
    {
      id: 'confirmation',
      title: 'Model Confirmation',
      subtitle: 'Review & Approvals',
      icon: ShieldCheck,
      isActive: currentStage === 'confirmation',
      isCompleted: ['executing', 'synthesizing', 'completed'].includes(currentStage)
    },
    {
      id: 'executing',
      title: 'AI Collaboration',
      subtitle: `${completedModelCount}/${activeModelCount} Models`,
      icon: Network,
      isActive: currentStage === 'executing',
      isCompleted: ['synthesizing', 'completed'].includes(currentStage)
    },
    {
      id: 'synthesizing',
      title: 'Synthesis AI',
      subtitle: 'Unified Integration',
      icon: Layers,
      isActive: currentStage === 'synthesizing',
      isCompleted: currentStage === 'completed'
    },
    {
      id: 'completed',
      title: 'Final Combined Result',
      subtitle: 'Production Solution',
      icon: Sparkles,
      isActive: currentStage === 'completed',
      isCompleted: currentStage === 'completed'
    }
  ];

  return (
    <div className="w-full rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 backdrop-blur-md">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 lg:gap-3">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={step.id}
              className={`relative flex flex-col items-center text-center p-3 rounded-lg border transition-all duration-300 ${
                step.isActive
                  ? 'border-purple-500/80 bg-purple-950/20 shadow-sm shadow-purple-500/20 ring-1 ring-purple-500/50'
                  : step.isCompleted
                  ? 'border-emerald-900/40 bg-emerald-950/10'
                  : 'border-neutral-800/80 bg-neutral-950/40 opacity-60'
              }`}
            >
              {/* Node Icon */}
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg mb-2 transition-all ${
                  step.isActive
                    ? 'bg-purple-600 text-white shadow-xs animate-pulse'
                    : step.isCompleted
                    ? 'bg-emerald-950 border border-emerald-700/60 text-emerald-400'
                    : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>

              {/* Title & Subtitle */}
              <div className="text-xs font-semibold text-neutral-200 truncate w-full">
                {step.title}
              </div>
              <div className="text-[11px] text-neutral-400 truncate w-full mt-0.5 font-mono">
                {step.subtitle}
              </div>

              {/* Next arrow for desktop */}
              {idx < steps.length - 1 && (
                <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-neutral-600">
                  <ArrowRight className="h-3 w-3" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
