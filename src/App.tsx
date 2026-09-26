/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ApiKeyModal } from './components/ApiKeyModal';
import { VisualPipeline, PipelineStage } from './components/VisualPipeline';
import { TaskInputSection } from './components/TaskInputSection';
import { AutoSelectionReview } from './components/AutoSelectionReview';
import { ExecutionConsole } from './components/ExecutionConsole';
import { FinalAnswerView } from './components/FinalAnswerView';
import { HistoryView } from './components/HistoryView';
import { DashboardView } from './components/DashboardView';
import { SettingsModal } from './components/SettingsModal';
import { StorageService } from './services/storage';
import { ApiService } from './services/api';
import {
  ExecutionMode,
  AutoSelectionPreferences,
  AutoSelectionPlan,
  ModelResult,
  SynthesisResult,
  TaskSession,
  ModelInfo
} from './types';

export default function App() {
  // Navigation & Modals
  const [activeTab, setActiveTab] = useState<'dashboard' | 'new-task' | 'history'>('dashboard');
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Connection State
  const [isConnected, setIsConnected] = useState(false);
  const [keyLabel, setKeyLabel] = useState<string | undefined>(undefined);

  // Pipeline Execution State
  const [pipelineStage, setPipelineStage] = useState<PipelineStage>('input');
  const [task, setTask] = useState('');
  const [adsAutoMode, setAdsAutoMode] = useState(true);
  const [executionMode, setExecutionMode] = useState<ExecutionMode>('parallel');
  const [preferences, setPreferences] = useState<AutoSelectionPreferences>({
    naturalLanguagePreference: '',
    maxModels: 4,
    budgetPreference: 'any',
    speedPriority: 'balanced',
    preferredProviders: ['Anthropic', 'OpenAI', 'Google', 'DeepSeek', 'Meta', 'Qwen', 'Mistral'],
    minContextTokens: 32000,
    mode: 'parallel'
  });

  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [plan, setPlan] = useState<AutoSelectionPlan | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExecutingModels, setIsExecutingModels] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [modelResults, setModelResults] = useState<ModelResult[]>([]);
  const [synthesisResult, setSynthesisResult] = useState<SynthesisResult | null>(null);

  // Active Session & History
  const [currentSession, setCurrentSession] = useState<TaskSession | null>(null);
  const [history, setHistory] = useState<TaskSession[]>([]);

  // Initialize
  useEffect(() => {
    const savedKey = StorageService.getApiKey();
    if (savedKey) {
      setIsConnected(true);
      setKeyLabel('OpenRouter Active');
    }
    setHistory(StorageService.getHistory());

    // Fetch models catalog
    ApiService.getModels()
      .then(res => setAvailableModels(res.models || []))
      .catch(() => {
        // Fallback models loaded automatically by backend
      });
  }, []);

  const handleKeyStatusChange = (connected: boolean, label?: string) => {
    setIsConnected(connected);
    setKeyLabel(label);
  };

  const handleNewTaskClick = (initialTask?: string, presetPreference?: string) => {
    setTask(initialTask || '');
    if (presetPreference) {
      setPreferences(prev => ({ ...prev, naturalLanguagePreference: presetPreference }));
    }
    setPlan(null);
    setModelResults([]);
    setSynthesisResult(null);
    setCurrentSession(null);
    setPipelineStage('input');
    setActiveTab('new-task');
  };

  // 1. Analyze & Auto-Select
  const handleAnalyzeAndSelect = async () => {
    if (!task.trim()) return;

    if (!StorageService.hasApiKey()) {
      setIsKeyModalOpen(true);
      return;
    }

    setIsAnalyzing(true);
    setPipelineStage('analysis');

    try {
      const selectedPlan = await ApiService.autoSelectModels({
        task: task.trim(),
        preferences: preferences.naturalLanguagePreference,
        constraints: {
          maxModels: preferences.maxModels,
          budget: preferences.budgetPreference,
          speedPriority: preferences.speedPriority,
          preferredProviders: preferences.preferredProviders,
          mode: executionMode
        }
      });

      setPlan(selectedPlan);
      setPipelineStage('confirmation');
    } catch (err: any) {
      alert(`Auto-selection error: ${err.message || 'Failed to analyze task.'}`);
      setPipelineStage('input');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 2. Launch Execution
  const handleApproveAndLaunch = async (approvedPlan: AutoSelectionPlan) => {
    setPlan(approvedPlan);
    setPipelineStage('executing');
    setIsExecutingModels(true);

    const initialResults: ModelResult[] = approvedPlan.selectedModels.map(m => ({
      modelId: m.modelId,
      modelName: m.modelName,
      provider: m.provider,
      roleName: m.roleName,
      status: 'pending'
    }));

    setModelResults(initialResults);

    const sessionId = `task_${Date.now()}`;
    const newSession: TaskSession = {
      id: sessionId,
      title: task.slice(0, 50),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      task,
      preferences,
      adsAutoMode,
      mode: executionMode,
      plan: approvedPlan,
      modelResults: initialResults
    };
    setCurrentSession(newSession);

    // Branch execution based on executionMode
    if (executionMode === 'pipeline') {
      await runPipelineExecution(approvedPlan, newSession);
    } else if (executionMode === 'debate') {
      await runDebateExecution(approvedPlan, newSession);
    } else {
      // Default: Parallel / Specialist execution
      await runParallelExecution(approvedPlan, newSession);
    }
  };

  // Parallel & Specialist Execution Flow
  const runParallelExecution = async (approvedPlan: AutoSelectionPlan, session: TaskSession) => {
    const updatedResults = [...session.modelResults];

    const modelPromises = approvedPlan.selectedModels.map(async (assigned, idx) => {
      // Set model to running
      updatedResults[idx] = { ...updatedResults[idx], status: 'running' };
      setModelResults([...updatedResults]);

      try {
        const res = await ApiService.executeSingleModel({
          modelId: assigned.modelId,
          roleSystemPrompt: assigned.roleSystemPrompt,
          taskPrompt: task
        });

        updatedResults[idx] = {
          ...updatedResults[idx],
          status: 'completed',
          response: res.response,
          durationMs: res.durationMs,
          tokenUsage: res.tokenUsage
        };
      } catch (err: any) {
        // Individual model error: DO NOT CRASH overall task
        updatedResults[idx] = {
          ...updatedResults[idx],
          status: 'failed',
          error: err.message || 'Model execution failed'
        };
      }

      setModelResults([...updatedResults]);
    });

    await Promise.all(modelPromises);
    setIsExecutingModels(false);

    // Proceed to automatic synthesis if at least one model succeeded
    const successfulCount = updatedResults.filter(r => r.status === 'completed').length;
    if (successfulCount > 0) {
      await runSynthesis(approvedPlan, updatedResults, session);
    }
  };

  // Debate Mode Execution Flow
  const runDebateExecution = async (approvedPlan: AutoSelectionPlan, session: TaskSession) => {
    const updatedResults = [...session.modelResults];

    // Round 1: Initial proposals
    for (let i = 0; i < approvedPlan.selectedModels.length; i++) {
      updatedResults[i] = { ...updatedResults[i], status: 'running' };
      setModelResults([...updatedResults]);
    }

    const round1Promises = approvedPlan.selectedModels.map(async (assigned, idx) => {
      try {
        const res = await ApiService.executeSingleModel({
          modelId: assigned.modelId,
          roleSystemPrompt: `${assigned.roleSystemPrompt}\nThis is Round 1 of an AI debate. Formulate your primary argument, architecture, or code design clearly.`,
          taskPrompt: task
        });
        updatedResults[idx] = {
          ...updatedResults[idx],
          status: 'completed',
          response: res.response,
          durationMs: res.durationMs,
          tokenUsage: res.tokenUsage
        };
      } catch (err: any) {
        updatedResults[idx] = {
          ...updatedResults[idx],
          status: 'failed',
          error: err.message || 'Model failed'
        };
      }
      setModelResults([...updatedResults]);
    });

    await Promise.all(round1Promises);

    // Round 2: Cross-critique & rebuttal
    const successfulRound1 = updatedResults.filter(r => r.status === 'completed');
    if (successfulRound1.length > 1) {
      const allProposals = successfulRound1
        .map(r => `[${r.modelName}]:\n${r.response?.slice(0, 1000)}...`)
        .join('\n\n');

      const round2Promises = approvedPlan.selectedModels.map(async (assigned, idx) => {
        if (updatedResults[idx].status !== 'completed') return;

        try {
          const res = await ApiService.executeSingleModel({
            modelId: assigned.modelId,
            roleSystemPrompt: `${assigned.roleSystemPrompt}\nThis is Round 2. Critically review the other models' perspectives below, identify flaws or missing edge cases, and refine your final stance.`,
            taskPrompt: `ORIGINAL TASK:\n${task}\n\nOTHER MODELS' PROPOSALS:\n${allProposals}`
          });

          updatedResults[idx] = {
            ...updatedResults[idx],
            response: `${updatedResults[idx].response}\n\n=== REBUTTAL & CRITIQUE ===\n${res.response}`,
            durationMs: (updatedResults[idx].durationMs || 0) + res.durationMs,
            tokenUsage: {
              promptTokens: (updatedResults[idx].tokenUsage?.promptTokens || 0) + res.tokenUsage.promptTokens,
              completionTokens: (updatedResults[idx].tokenUsage?.completionTokens || 0) + res.tokenUsage.completionTokens,
              totalTokens: (updatedResults[idx].tokenUsage?.totalTokens || 0) + res.tokenUsage.totalTokens
            }
          };
          setModelResults([...updatedResults]);
        } catch (e) {
          // keep round 1 response if round 2 fails
        }
      });
      await Promise.all(round2Promises);
    }

    setIsExecutingModels(false);
    await runSynthesis(approvedPlan, updatedResults, session);
  };

  // Pipeline Sequential Chain Execution
  const runPipelineExecution = async (approvedPlan: AutoSelectionPlan, session: TaskSession) => {
    const updatedResults = [...session.modelResults];
    let rollingContext = '';

    for (let i = 0; i < approvedPlan.selectedModels.length; i++) {
      const assigned = approvedPlan.selectedModels[i];
      updatedResults[i] = { ...updatedResults[i], status: 'running' };
      setModelResults([...updatedResults]);

      const stagePrompt = i === 0
        ? task
        : `ORIGINAL USER TASK:\n${task}\n\nOUTPUT FROM PREVIOUS STAGE (${approvedPlan.selectedModels[i - 1].modelName}):\n${rollingContext}\n\nYOUR TASK AS ${assigned.roleName}: Advance and refine this solution further.`;

      try {
        const res = await ApiService.executeSingleModel({
          modelId: assigned.modelId,
          roleSystemPrompt: assigned.roleSystemPrompt,
          taskPrompt: stagePrompt
        });

        updatedResults[i] = {
          ...updatedResults[i],
          status: 'completed',
          response: res.response,
          durationMs: res.durationMs,
          tokenUsage: res.tokenUsage
        };
        rollingContext = res.response;
      } catch (err: any) {
        updatedResults[i] = {
          ...updatedResults[i],
          status: 'failed',
          error: err.message || 'Pipeline step failed'
        };
      }
      setModelResults([...updatedResults]);
    }

    setIsExecutingModels(false);
    await runSynthesis(approvedPlan, updatedResults, session);
  };

  // 3. Collaborative Synthesis
  const runSynthesis = async (
    approvedPlan: AutoSelectionPlan,
    currentResults: ModelResult[],
    session: TaskSession
  ) => {
    setPipelineStage('synthesizing');
    setIsSynthesizing(true);

    const synthInit: SynthesisResult = {
      synthesisModelId: approvedPlan.synthesisModel.modelId,
      synthesisModelName: approvedPlan.synthesisModel.modelName,
      status: 'running'
    };
    setSynthesisResult(synthInit);

    try {
      const res = await ApiService.synthesize({
        task,
        synthesisModelId: approvedPlan.synthesisModel.modelId,
        modelResults: currentResults.map(r => ({
          modelId: r.modelId,
          modelName: r.modelName,
          roleName: r.roleName,
          response: r.response || '',
          status: r.status
        }))
      });

      const finishedSynth: SynthesisResult = {
        synthesisModelId: res.synthesisModelId,
        synthesisModelName: approvedPlan.synthesisModel.modelName,
        status: 'completed',
        finalAnswer: res.finalAnswer,
        durationMs: res.durationMs,
        tokenUsage: res.tokenUsage
      };

      setSynthesisResult(finishedSynth);
      setPipelineStage('completed');

      // Persist in history
      const finalizedSession: TaskSession = {
        ...session,
        modelResults: currentResults,
        synthesisResult: finishedSynth,
        updatedAt: new Date().toISOString()
      };

      setCurrentSession(finalizedSession);
      StorageService.saveTaskSession(finalizedSession);
      setHistory(StorageService.getHistory());
    } catch (err: any) {
      setSynthesisResult({
        synthesisModelId: approvedPlan.synthesisModel.modelId,
        synthesisModelName: approvedPlan.synthesisModel.modelName,
        status: 'failed',
        error: err.message || 'Synthesis failed.'
      });
      // Allow user to see console and retry
      setPipelineStage('executing');
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Retry a single model
  const handleRetryModel = async (modelId: string) => {
    if (!plan) return;
    const targetIdx = modelResults.findIndex(m => m.modelId === modelId);
    if (targetIdx === -1) return;

    const assigned = plan.selectedModels.find(m => m.modelId === modelId);
    if (!assigned) return;

    const updated = [...modelResults];
    updated[targetIdx] = { ...updated[targetIdx], status: 'retrying' };
    setModelResults(updated);

    try {
      const res = await ApiService.executeSingleModel({
        modelId: assigned.modelId,
        roleSystemPrompt: assigned.roleSystemPrompt,
        taskPrompt: task
      });

      updated[targetIdx] = {
        ...updated[targetIdx],
        status: 'completed',
        response: res.response,
        durationMs: res.durationMs,
        tokenUsage: res.tokenUsage,
        error: undefined
      };
      setModelResults([...updated]);

      if (currentSession) {
        const updatedSession = { ...currentSession, modelResults: updated };
        setCurrentSession(updatedSession);
        StorageService.saveTaskSession(updatedSession);
        setHistory(StorageService.getHistory());
      }
    } catch (err: any) {
      updated[targetIdx] = {
        ...updated[targetIdx],
        status: 'failed',
        error: err.message || 'Retry failed'
      };
      setModelResults([...updated]);
    }
  };

  // Re-run synthesis with available results
  const handleRegenerateSynthesis = () => {
    if (!plan || !currentSession) return;
    runSynthesis(plan, modelResults, currentSession);
  };

  // Re-run failed models
  const handleRetryFailedModels = async () => {
    const failed = modelResults.filter(m => m.status === 'failed');
    for (const f of failed) {
      await handleRetryModel(f.modelId);
    }
    if (plan && currentSession) {
      runSynthesis(plan, modelResults, currentSession);
    }
  };

  // Reopen session from history or dashboard
  const handleReopenSession = (session: TaskSession) => {
    setCurrentSession(session);
    setTask(session.task);
    setPlan(session.plan || null);
    setModelResults(session.modelResults);
    setSynthesisResult(session.synthesisResult || null);
    setExecutionMode(session.mode);
    setAdsAutoMode(session.adsAutoMode);
    if (session.synthesisResult?.finalAnswer) {
      setPipelineStage('completed');
    } else {
      setPipelineStage('executing');
    }
    setActiveTab('new-task');
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-purple-600/30 selection:text-purple-200">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isConnected={isConnected}
        keyLabel={keyLabel}
        onOpenKeyModal={() => setIsKeyModalOpen(true)}
        onNewTaskClick={() => handleNewTaskClick()}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* VIEW 1: Dashboard View */}
        {activeTab === 'dashboard' && (
          <DashboardView
            isConnected={isConnected}
            keyLabel={keyLabel}
            onOpenKeyModal={() => setIsKeyModalOpen(true)}
            onStartNewTask={(presetTask, presetPref) => {
              handleNewTaskClick(presetTask, presetPref);
            }}
            recentTasks={history}
            availableModels={availableModels}
            adsAutoMode={adsAutoMode}
            onToggleAutoMode={() => setAdsAutoMode(!adsAutoMode)}
            onReopenSession={handleReopenSession}
          />
        )}

        {/* VIEW 2: Task Workspace */}
        {activeTab === 'new-task' && (
          <div className="space-y-6">
            {/* Visual Pipeline Bar */}
            <VisualPipeline
              currentStage={pipelineStage}
              activeModelCount={plan?.selectedModels.length || 4}
              completedModelCount={modelResults.filter(m => m.status === 'completed').length}
            />

            {/* Stage 1: Task Input */}
            {pipelineStage === 'input' && (
              <TaskInputSection
                task={task}
                setTask={setTask}
                adsAutoMode={adsAutoMode}
                setAdsAutoMode={setAdsAutoMode}
                executionMode={executionMode}
                setExecutionMode={setExecutionMode}
                preferences={preferences}
                setPreferences={setPreferences}
                onAnalyzeAndSelect={handleAnalyzeAndSelect}
                isAnalyzing={isAnalyzing}
                hasApiKey={isConnected}
                onOpenKeyModal={() => setIsKeyModalOpen(true)}
              />
            )}

            {/* Stage 2 & 3: Model Auto-Selection Review & Confirmation */}
            {(pipelineStage === 'confirmation' || pipelineStage === 'selection' || (pipelineStage === 'analysis' && plan)) && plan && (
              <AutoSelectionReview
                plan={plan}
                availableModels={availableModels}
                onApproveAndLaunch={handleApproveAndLaunch}
                onReAnalyze={handleAnalyzeAndSelect}
                onCancel={() => setPipelineStage('input')}
              />
            )}

            {/* Stage 4: Execution Console (During Execution & Model Inspection) */}
            {(pipelineStage === 'executing' || pipelineStage === 'synthesizing') && (
              <ExecutionConsole
                modelResults={modelResults}
                synthesisResult={synthesisResult || undefined}
                isExecutingModels={isExecutingModels}
                isSynthesizing={isSynthesizing}
                onRetryModel={handleRetryModel}
                onProceedToSynthesis={() => {
                  if (plan && currentSession) {
                    runSynthesis(plan, modelResults, currentSession);
                  }
                }}
                onViewFinalAnswer={() => setPipelineStage('completed')}
              />
            )}

            {/* Stage 5: Final Synthesized Solution */}
            {pipelineStage === 'completed' && currentSession && (
              <FinalAnswerView
                session={currentSession}
                onRegenerateSynthesis={handleRegenerateSynthesis}
                onRetryFailedModels={handleRetryFailedModels}
                onBackToConsole={() => setPipelineStage('executing')}
                onStartNewTask={() => handleNewTaskClick()}
              />
            )}
          </div>
        )}

        {/* VIEW 3: History View */}
        {activeTab === 'history' && (
          <HistoryView
            history={history}
            onReopenSession={handleReopenSession}
            onRefreshHistory={() => setHistory(StorageService.getHistory())}
            onNewTask={() => handleNewTaskClick()}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-neutral-900 bg-neutral-950 py-6 text-center text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-400">AI Fusion Hub</span>
            <span>·</span>
            <span>Multi-Model AI Orchestration Engine</span>
          </div>
          <p className="text-[11px] text-neutral-500">
            Use your own OpenRouter API key. Model availability, limits, and costs depend on your OpenRouter account and selected models.
          </p>
        </div>
      </footer>

      {/* Modals */}
      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        onKeyStatusChange={handleKeyStatusChange}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        preferences={preferences}
        setPreferences={setPreferences}
      />
    </div>
  );
}
