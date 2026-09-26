import { StorageService } from './storage';
import { ModelInfo, AutoSelectionPlan, KeyVerificationResponse } from '../types';

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  const key = StorageService.getApiKey();
  if (key) {
    headers['x-openrouter-key'] = key;
  }
  return headers;
}

export const ApiService = {
  async testKey(apiKey: string): Promise<KeyVerificationResponse> {
    const res = await fetch('/api/test-key', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-openrouter-key': apiKey.trim()
      }
    });
    const data = await res.json();
    if (!res.ok) {
      return {
        valid: false,
        error: data.error || `HTTP ${res.status}: Failed to verify key`
      };
    }
    return data;
  },

  async getModels(): Promise<{ models: ModelInfo[]; source: string }> {
    const res = await fetch('/api/models', {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      throw new Error(`Failed to load model catalog (HTTP ${res.status})`);
    }
    return res.json();
  },

  async autoSelectModels(params: {
    task: string;
    preferences?: string;
    constraints?: {
      maxModels?: number;
      budget?: string;
      speedPriority?: string;
      preferredProviders?: string[];
      minContext?: number;
      mode?: string;
    };
  }): Promise<AutoSelectionPlan> {
    const res = await fetch('/api/auto-select', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Automatic model selection failed');
    }
    return data;
  },

  async executeSingleModel(params: {
    modelId: string;
    roleSystemPrompt: string;
    taskPrompt: string;
    temperature?: number;
    maxTokens?: number;
    contextHistory?: { role: string; content: string }[];
  }): Promise<{
    success: boolean;
    modelId: string;
    response: string;
    durationMs: number;
    tokenUsage: { promptTokens: number; completionTokens: number; totalTokens: number };
  }> {
    const res = await fetch('/api/execute-single', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `Model ${params.modelId} execution failed`);
    }
    return data;
  },

  async synthesize(params: {
    task: string;
    synthesisModelId: string;
    modelResults: {
      modelId: string;
      modelName: string;
      roleName: string;
      response: string;
      status: string;
    }[];
    customSynthesisInstructions?: string;
    temperature?: number;
  }): Promise<{
    success: boolean;
    synthesisModelId: string;
    finalAnswer: string;
    durationMs: number;
    tokenUsage: { promptTokens: number; completionTokens: number; totalTokens: number };
  }> {
    const res = await fetch('/api/synthesize', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `Synthesis failed with model ${params.synthesisModelId}`);
    }
    return data;
  }
};
