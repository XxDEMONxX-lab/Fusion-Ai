import React from 'react';
import { X, Sliders, Shield, Zap, DollarSign, Check } from 'lucide-react';
import { AutoSelectionPreferences } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: AutoSelectionPreferences;
  setPreferences: React.Dispatch<React.SetStateAction<AutoSelectionPreferences>>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  preferences,
  setPreferences
}) => {
  if (!isOpen) return null;

  const PROVIDERS = ['Anthropic', 'OpenAI', 'Google', 'DeepSeek', 'Meta', 'Qwen', 'Mistral'];

  const toggleProvider = (p: string) => {
    setPreferences(prev => {
      const current = prev.preferredProviders || [];
      const updated = current.includes(p)
        ? current.filter(item => item !== p)
        : [...current, p];
      return { ...prev, preferredProviders: updated };
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl relative text-neutral-100">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-800 text-purple-400">
              <Sliders className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-white">
                Advanced AI & Orchestration Settings
              </h3>
              <p className="text-xs text-neutral-400">
                Fine-tune model selection criteria and execution parameters
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Max Models Slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-neutral-300">
                Maximum Automatically Selected Models
              </label>
              <span className="text-xs font-mono text-purple-400 font-semibold">
                {preferences.maxModels} Models
              </span>
            </div>
            <input
              type="range"
              min={2}
              max={6}
              value={preferences.maxModels}
              onChange={(e) =>
                setPreferences(prev => ({ ...prev, maxModels: Number(e.target.value) }))
              }
              className="w-full accent-purple-500 bg-neutral-800 h-1.5 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-neutral-500 font-mono mt-1">
              <span>2 Models (Lean)</span>
              <span>4 Models (Recommended)</span>
              <span>6 Models (Comprehensive)</span>
            </div>
          </div>

          {/* Budget Priority */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-2">
              Budget & Cost Preference
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'any', label: 'Balanced', desc: 'Optimal trade-off' },
                { id: 'low_cost', label: 'Affordable', desc: 'Ultra-low cost' },
                { id: 'best_performance', label: 'Maximum Power', desc: 'Top benchmarks' }
              ].map(b => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() =>
                    setPreferences(prev => ({ ...prev, budgetPreference: b.id as any }))
                  }
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    preferences.budgetPreference === b.id
                      ? 'border-purple-500 bg-purple-950/20 text-white'
                      : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-semibold">{b.label}</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">{b.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Speed vs Reasoning Priority */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-2">
              Speed & Latency Priority
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'fast', label: 'High Speed', desc: 'Flash & mini models' },
                { id: 'balanced', label: 'Balanced', desc: 'Standard latency' },
                { id: 'deep', label: 'Deep Reasoning', desc: 'R1 / o1 reasoning' }
              ].map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() =>
                    setPreferences(prev => ({ ...prev, speedPriority: s.id as any }))
                  }
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    preferences.speedPriority === s.id
                      ? 'border-purple-500 bg-purple-950/20 text-white'
                      : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-semibold">{s.label}</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Preferred Providers Filter */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-2">
              Preferred Model Providers (Diversity Enforcer)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PROVIDERS.map(p => {
                const isSelected = (preferences.preferredProviders || []).includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => toggleProvider(p)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      isSelected
                        ? 'bg-purple-950/70 border-purple-500/80 text-purple-200'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3 text-purple-400" />}
                    <span>{p}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-neutral-500 mt-1.5">
              Leave all selected for maximum model variety.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end pt-4 border-t border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-sm"
          >
            Apply Settings
          </button>
        </div>
      </div>
    </div>
  );
};
