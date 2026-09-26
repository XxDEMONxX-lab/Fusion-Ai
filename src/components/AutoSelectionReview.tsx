import React, { useState } from 'react';
import { CheckCircle2, Cpu, Edit3, Trash2, Plus, Sparkles, Layers, Shield, ArrowRight, RefreshCw, X, ChevronDown } from 'lucide-react';
import { AutoSelectionPlan, AssignedModel, ModelInfo } from '../types';

interface AutoSelectionReviewProps {
  plan: AutoSelectionPlan;
  availableModels: ModelInfo[];
  onApproveAndLaunch: (updatedPlan: AutoSelectionPlan) => void;
  onReAnalyze: () => void;
  onCancel: () => void;
}

export const AutoSelectionReview: React.FC<AutoSelectionReviewProps> = ({
  plan: initialPlan,
  availableModels,
  onApproveAndLaunch,
  onReAnalyze,
  onCancel
}) => {
  const [currentPlan, setCurrentPlan] = useState<AutoSelectionPlan>(initialPlan);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSynthesisPicker, setShowSynthesisPicker] = useState(false);

  // Edit role dialog states
  const [editRoleName, setEditRoleName] = useState('');
  const [editSystemPrompt, setEditSystemPrompt] = useState('');
  const [editModelId, setEditModelId] = useState('');

  const handleStartEdit = (index: number) => {
    const model = currentPlan.selectedModels[index];
    setEditingIndex(index);
    setEditRoleName(model.roleName);
    setEditSystemPrompt(model.roleSystemPrompt);
    setEditModelId(model.modelId);
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;
    const updated = [...currentPlan.selectedModels];
    const selectedCatalogModel = availableModels.find(m => m.id === editModelId);

    updated[editingIndex] = {
      ...updated[editingIndex],
      modelId: editModelId,
      modelName: selectedCatalogModel ? selectedCatalogModel.name : updated[editingIndex].modelName,
      provider: selectedCatalogModel ? selectedCatalogModel.provider : updated[editingIndex].provider,
      roleName: editRoleName,
      roleSystemPrompt: editSystemPrompt,
      contextLength: selectedCatalogModel ? selectedCatalogModel.context_length : updated[editingIndex].contextLength
    };

    setCurrentPlan(prev => ({
      ...prev,
      selectedModels: updated
    }));
    setEditingIndex(null);
  };

  const handleRemoveModel = (index: number) => {
    if (currentPlan.selectedModels.length <= 2) {
      alert('A minimum of two models is required for multi-AI comparison and synthesis.');
      return;
    }
    const updated = currentPlan.selectedModels.filter((_, i) => i !== index);
    setCurrentPlan(prev => ({
      ...prev,
      selectedModels: updated
    }));
  };

  const handleAddModel = (catalogModel: ModelInfo) => {
    const newAssigned: AssignedModel = {
      modelId: catalogModel.id,
      modelName: catalogModel.name,
      provider: catalogModel.provider,
      roleName: `${catalogModel.provider} Specialist`,
      roleSystemPrompt: `You are an expert specialist utilizing ${catalogModel.name}. Provide in-depth analysis, precise solutions, and rigorous verification.`,
      reason: 'User manual addition to multi-AI ensemble.',
      contextLength: catalogModel.context_length,
      pricingDisplay: catalogModel.pricing ? `$${Number(catalogModel.pricing.prompt).toFixed(2)} / $${Number(catalogModel.pricing.completion).toFixed(2)}` : undefined,
      speedRating: catalogModel.speedRating || 'Balanced'
    };

    setCurrentPlan(prev => ({
      ...prev,
      selectedModels: [...prev.selectedModels, newAssigned]
    }));
    setShowAddModal(false);
  };

  const handleSelectSynthesisModel = (catalogModel: ModelInfo) => {
    setCurrentPlan(prev => ({
      ...prev,
      synthesisModel: {
        modelId: catalogModel.id,
        modelName: catalogModel.name,
        provider: catalogModel.provider,
        reason: 'Selected by user for final collaborative synthesis.'
      }
    }));
    setShowSynthesisPicker(false);
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Plan Header Card */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/90 p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-purple-400 font-semibold tracking-wider">
                ADS AUTO SELECTION BLUEPRINT
              </span>
              <span className="text-xs text-neutral-500">·</span>
              <span className="text-xs text-neutral-400 font-mono">
                {currentPlan.selectedModels.length} Models Assigned
              </span>
            </div>
            <h2 className="font-display text-xl font-bold text-white mt-1">
              {currentPlan.taskCategory}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onReAnalyze}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-300 bg-neutral-800 hover:bg-neutral-700 rounded-lg border border-neutral-700 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Re-Analyze</span>
            </button>
            <button
              type="button"
              onClick={() => onApproveAndLaunch(currentPlan)}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-sm shadow-purple-600/30 transition-all active:scale-[0.98]"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Approve & Launch Multi-AI Task</span>
            </button>
          </div>
        </div>

        {/* Detected Requirements & Reasoning */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs font-semibold text-neutral-300 mb-2">
              Detected Task Requirements
            </div>
            <div className="space-y-1.5">
              {currentPlan.detectedRequirements.map((req, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-neutral-400">
                  <div className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                  <span>{req}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-neutral-300 mb-2">
              Selection Strategy & Rationale
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {currentPlan.selectionReasoning}
            </p>
            <div className="flex items-center gap-3 mt-3 text-xs text-neutral-400 font-mono">
              <span>Est. Cost: <strong className="text-neutral-200">{currentPlan.estimatedCost}</strong></span>
              <span>·</span>
              <span>Speed: <strong className="text-neutral-200">{currentPlan.estimatedSpeed}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Models Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white">
              Participating AI Specialists ({currentPlan.selectedModels.length})
            </h3>
            <span className="text-xs text-neutral-500">
              Each AI executes independently before synthesis
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1 text-xs text-purple-400 hover:text-purple-300 bg-purple-950/40 border border-purple-900/60 rounded-lg transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Model</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentPlan.selectedModels.map((model, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-4 hover:border-neutral-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/50">
                        {model.roleName}
                      </span>
                      <span className="text-[11px] text-neutral-400">
                        {model.provider}
                      </span>
                    </div>
                    <div className="font-semibold text-sm text-white mt-1">
                      {model.modelName}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(idx)}
                      className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors"
                      title="Edit role and prompt"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    {currentPlan.selectedModels.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveModel(idx)}
                        className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded-lg transition-colors"
                        title="Remove model"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* System Prompt Excerpt */}
                <div className="p-2.5 rounded-lg bg-neutral-950/60 border border-neutral-800/80 my-2">
                  <div className="text-[11px] text-neutral-400 font-mono mb-1">
                    System Instruction:
                  </div>
                  <p className="text-xs text-neutral-300 line-clamp-2">
                    {model.roleSystemPrompt}
                  </p>
                </div>

                {/* Rationale */}
                <p className="text-[11px] text-neutral-400 italic mt-2">
                  "{model.reason}"
                </p>
              </div>

              {/* Model Specs */}
              <div className="mt-3 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                <span>Context: {model.contextLength ? `${Math.round(model.contextLength / 1000)}k` : 'Auto'}</span>
                <span>Speed: {model.speedRating || 'Balanced'}</span>
                {model.pricingDisplay && <span>{model.pricingDisplay}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Synthesis Model Section */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-950/70 border border-indigo-800/60 text-indigo-400">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-indigo-400 font-semibold">
                  DESIGNATED SYNTHESIS MODEL
                </span>
                <span className="text-xs text-neutral-500">·</span>
                <span className="text-xs text-neutral-300 font-medium">
                  {currentPlan.synthesisModel.modelName} ({currentPlan.synthesisModel.provider})
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                {currentPlan.synthesisModel.reason}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowSynthesisPicker(true)}
            className="text-xs font-medium text-indigo-400 hover:text-indigo-300 bg-indigo-950/50 border border-indigo-800/60 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
          >
            Change Synthesis Model
          </button>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-neutral-400 hover:text-neutral-200"
        >
          Cancel & Return to Task Edit
        </button>

        <button
          type="button"
          onClick={() => onApproveAndLaunch(currentPlan)}
          className="flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-sm shadow-purple-600/30 transition-all active:scale-[0.98]"
        >
          <Sparkles className="h-4 w-4" />
          <span>Confirm & Start Multi-AI Execution</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Edit Role Modal */}
      {editingIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="text-sm font-semibold text-white">
                Customize AI Specialist Role
              </h3>
              <button
                onClick={() => setEditingIndex(null)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs text-neutral-400 mb-1">Assigned Model</label>
              <select
                value={editModelId}
                onChange={(e) => setEditModelId(e.target.value)}
                className="w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                {availableModels.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.provider})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-neutral-400 mb-1">Role Title</label>
              <input
                type="text"
                value={editRoleName}
                onChange={(e) => setEditRoleName(e.target.value)}
                className="w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs text-neutral-400 mb-1">Role System Instruction</label>
              <textarea
                rows={4}
                value={editSystemPrompt}
                onChange={(e) => setEditSystemPrompt(e.target.value)}
                className="w-full rounded-md border border-neutral-800 bg-neutral-950 p-3 text-xs text-white focus:outline-none focus:border-purple-500 leading-relaxed font-sans"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingIndex(null)}
                className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-md shadow-xs"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Model Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm">
          <div className="w-full max-w-xl max-h-[80vh] flex flex-col rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="text-sm font-semibold text-white">
                Add AI Model from Catalog
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="my-3 overflow-y-auto space-y-2 pr-1">
              {availableModels
                .filter(m => !currentPlan.selectedModels.some(s => s.modelId === m.id))
                .map(m => (
                  <div
                    key={m.id}
                    className="p-3 rounded-lg border border-neutral-800 bg-neutral-950/50 hover:border-purple-500/60 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">{m.name}</span>
                        <span className="text-[11px] text-neutral-500 font-mono">({m.provider})</span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-0.5 line-clamp-1">{m.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddModel(m)}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-neutral-800 hover:bg-purple-600 rounded-md transition-colors shrink-0"
                    >
                      Select
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Synthesis Model Picker Modal */}
      {showSynthesisPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm">
          <div className="w-full max-w-xl max-h-[80vh] flex flex-col rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="text-sm font-semibold text-white">
                Select Model for Final Synthesis
              </h3>
              <button
                onClick={() => setShowSynthesisPicker(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="my-3 overflow-y-auto space-y-2 pr-1">
              {availableModels.map(m => (
                <div
                  key={m.id}
                  className="p-3 rounded-lg border border-neutral-800 bg-neutral-950/50 hover:border-indigo-500/60 flex items-center justify-between gap-3 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">{m.name}</span>
                      <span className="text-[11px] text-neutral-500 font-mono">({m.provider})</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-0.5 line-clamp-1">{m.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectSynthesisModel(m)}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-neutral-800 hover:bg-indigo-600 rounded-md transition-colors shrink-0"
                  >
                    Set as Synthesizer
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
