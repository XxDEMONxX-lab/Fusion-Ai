export type ExecutionMode = 'parallel' | 'debate' | 'specialist' | 'pipeline';

export interface ModelPricing {
  prompt: number; // per 1M tokens or raw token cost
  completion: number;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  context_length: number;
  pricing?: {
    prompt: string | number;
    completion: string | number;
  };
  description?: string;
  capabilities?: string[];
  isAvailable?: boolean;
  speedRating?: 'Fast' | 'Balanced' | 'Deep Reasoning';
  isFree?: boolean;
}

export interface AssignedModel {
  modelId: string;
  modelName: string;
  provider: string;
  roleName: string;
  roleSystemPrompt: string;
  reason: string;
  contextLength?: number;
  pricingDisplay?: string;
  speedRating?: 'Fast' | 'Balanced' | 'Deep Reasoning';
}

export interface AutoSelectionPlan {
  taskCategory: string;
  detectedRequirements: string[];
  selectionReasoning: string;
  selectedModels: AssignedModel[];
  synthesisModel: {
    modelId: string;
    modelName: string;
    provider: string;
    reason: string;
  };
  suggestedMode: ExecutionMode;
  estimatedCost: string;
  estimatedSpeed: string;
}

export interface AutoSelectionPreferences {
  naturalLanguagePreference: string;
  maxModels: number;
  budgetPreference: 'any' | 'free_only' | 'low_cost' | 'best_performance';
  speedPriority: 'fast' | 'balanced' | 'deep';
  preferredProviders: string[];
  minContextTokens: number;
  mode: ExecutionMode;
}

export type ModelExecutionState = 'idle' | 'pending' | 'running' | 'completed' | 'failed' | 'retrying';

export interface ModelResult {
  modelId: string;
  modelName: string;
  provider: string;
  roleName: string;
  status: ModelExecutionState;
  response?: string;
  error?: string;
  durationMs?: number;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  costEstimate?: number;
}

export interface SynthesisResult {
  synthesisModelId: string;
  synthesisModelName: string;
  status: ModelExecutionState;
  finalAnswer?: string;
  error?: string;
  durationMs?: number;
  modelContributions?: {
    modelName: string;
    keyContribution: string;
  }[];
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  costEstimate?: number;
}

export interface TaskSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  task: string;
  preferences: AutoSelectionPreferences;
  adsAutoMode: boolean;
  mode: ExecutionMode;
  plan?: AutoSelectionPlan;
  modelResults: ModelResult[];
  synthesisResult?: SynthesisResult;
  advancedPromptConfig?: {
    objective?: string;
    context?: string;
    requirements?: string;
    outputFormat?: string;
    synthesisInstructions?: string;
  };
  totalTokens?: number;
  totalCostEstimate?: number;
}

export interface KeyVerificationResponse {
  valid: boolean;
  label?: string;
  limit?: number | null;
  usage?: number | null;
  isFreeTier?: boolean;
  rateLimit?: {
    requests?: number;
    interval?: string;
  };
  error?: string;
}
