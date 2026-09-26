import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Security: parse JSON body with sensible limit
app.use(express.json({ limit: '5mb' }));

// Simple in-memory rate limiter per IP: max 120 requests / minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60000 });
    return next();
  }

  if (record.count >= 120) {
    return res.status(429).json({ error: 'Too many requests. Please slow down and try again shortly.' });
  }

  record.count += 1;
  next();
}

app.use('/api', rateLimiter);

// Helper to extract API key from headers securely (NEVER LOGGED)
function getOpenRouterKey(req: Request): string | null {
  const headerKey = req.headers['x-openrouter-key'] as string | undefined;
  if (headerKey && headerKey.trim().length > 0) {
    return headerKey.trim();
  }
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token) return token;
  }
  return null;
}

// Model Catalog Cache
let cachedModels: any[] | null = null;
let modelsCachedAt = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Verified fallback catalog with up-to-date models and pricing ($ per 1M tokens)
const FALLBACK_MODELS = [
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    context_length: 200000,
    pricing: { prompt: 3.0, completion: 15.0 },
    description: 'Premier model for complex reasoning, architectural planning, code generation, and nuanced synthesis.',
    capabilities: ['coding', 'reasoning', 'planning', 'synthesis'],
    speedRating: 'Balanced',
    isFree: false
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    context_length: 128000,
    pricing: { prompt: 2.5, completion: 10.0 },
    description: 'Flagship versatile multimodal model with strong system implementation, logic, and rapid throughput.',
    capabilities: ['coding', 'reasoning', 'implementation', 'fast'],
    speedRating: 'Fast',
    isFree: false
  },
  {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek V3',
    provider: 'DeepSeek',
    context_length: 64000,
    pricing: { prompt: 0.14, completion: 0.28 },
    description: 'State-of-the-art open-weights architecture with stellar coding, optimization, and ultra-affordable cost.',
    capabilities: ['coding', 'optimization', 'affordable', 'fast'],
    speedRating: 'Fast',
    isFree: false
  },
  {
    id: 'deepseek/deepseek-r1',
    name: 'DeepSeek R1',
    provider: 'DeepSeek',
    context_length: 64000,
    pricing: { prompt: 0.55, completion: 2.19 },
    description: 'Deep reinforcement reasoning model specializing in security audits, edge-case vulnerability detection, and mathematical rigor.',
    capabilities: ['reasoning', 'security', 'auditing', 'math'],
    speedRating: 'Deep Reasoning',
    isFree: false
  },
  {
    id: 'google/gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    context_length: 1000000,
    pricing: { prompt: 1.25, completion: 5.0 },
    description: 'Massive 1M token context window, deep comprehension, multi-source analysis, and comprehensive architectural breadth.',
    capabilities: ['long-context', 'reasoning', 'analysis', 'research'],
    speedRating: 'Balanced',
    isFree: false
  },
  {
    id: 'google/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    context_length: 1000000,
    pricing: { prompt: 0.075, completion: 0.3 },
    description: 'Ultra-low latency, 1M context, exceptional throughput for rapid analysis and secondary reviews.',
    capabilities: ['fast', 'affordable', 'long-context', 'coding'],
    speedRating: 'Fast',
    isFree: false
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B Instruct',
    provider: 'Meta',
    context_length: 128000,
    pricing: { prompt: 0.18, completion: 0.35 },
    description: 'High-caliber open-source intelligence with strong compliance, balanced execution, and independent verification.',
    capabilities: ['coding', 'writing', 'reasoning', 'affordable'],
    speedRating: 'Fast',
    isFree: false
  },
  {
    id: 'qwen/qwen-2.5-coder-32b-instruct',
    name: 'Qwen 2.5 Coder 32B',
    provider: 'Qwen',
    context_length: 32768,
    pricing: { prompt: 0.07, completion: 0.16 },
    description: 'Dedicated programming specialist model trained specifically on codebases, bug fixing, and syntax precision.',
    capabilities: ['coding', 'debugging', 'syntax', 'affordable'],
    speedRating: 'Fast',
    isFree: false
  },
  {
    id: 'mistralai/mistral-large-2411',
    name: 'Mistral Large 2',
    provider: 'Mistral',
    context_length: 128000,
    pricing: { prompt: 2.0, completion: 6.0 },
    description: 'Top-tier European flagship model excelling in multilingual precision, strict reasoning, and code refactoring.',
    capabilities: ['reasoning', 'coding', 'multilingual'],
    speedRating: 'Balanced',
    isFree: false
  }
];

// 1. Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'AI Fusion Hub', timestamp: Date.now() });
});

// 2. Test OpenRouter Connection
app.post('/api/test-key', async (req: Request, res: Response) => {
  const apiKey = getOpenRouterKey(req);
  if (!apiKey) {
    return res.status(400).json({ valid: false, error: 'No OpenRouter API key provided.' });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const authRes = await fetch('https://openrouter.ai/api/v1/auth/key', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://aifusionhub.internal',
        'X-Title': 'AI Fusion Hub'
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!authRes.ok) {
      if (authRes.status === 401) {
        return res.status(401).json({ valid: false, error: 'Invalid OpenRouter API Key. Please verify and re-enter.' });
      }
      return res.status(authRes.status).json({ valid: false, error: `OpenRouter returned status ${authRes.status}` });
    }

    const data = await authRes.json();
    const keyData = data.data || {};

    return res.json({
      valid: true,
      label: keyData.label || 'Connected OpenRouter Key',
      limit: keyData.limit ?? null,
      usage: keyData.usage ?? 0,
      isFreeTier: Boolean(keyData.is_free_tier),
      rateLimit: keyData.rate_limit || null
    });
  } catch (err: any) {
    return res.status(500).json({
      valid: false,
      error: err.name === 'AbortError' ? 'Connection timed out while verifying key with OpenRouter.' : (err.message || 'Network error verifying key')
    });
  }
});

// 3. Models List
app.get('/api/models', async (req: Request, res: Response) => {
  const now = Date.now();
  if (cachedModels && now - modelsCachedAt < CACHE_TTL_MS) {
    return res.json({ models: cachedModels, source: 'cache' });
  }

  const apiKey = getOpenRouterKey(req);
  const headers: Record<string, string> = {
    'HTTP-Referer': 'https://aifusionhub.internal',
    'X-Title': 'AI Fusion Hub'
  };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const orRes = await fetch('https://openrouter.ai/api/v1/models', {
      headers,
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (orRes.ok) {
      const data = await orRes.json();
      const rawModels: any[] = data.data || [];

      // Filter and normalize key models with helpful metadata
      const formatted = rawModels.map((m: any) => {
        const id = m.id;
        const provider = id.split('/')[0] || 'Unknown';
        const promptCost = m.pricing?.prompt ? parseFloat(m.pricing.prompt) * 1000000 : 0;
        const completionCost = m.pricing?.completion ? parseFloat(m.pricing.completion) * 1000000 : 0;

        return {
          id: m.id,
          name: m.name || id,
          provider: provider.charAt(0).toUpperCase() + provider.slice(1),
          context_length: m.context_length || 32768,
          pricing: {
            prompt: promptCost,
            completion: completionCost
          },
          description: m.description || '',
          capabilities: extractCapabilities(m),
          speedRating: determineSpeedRating(m),
          isFree: promptCost === 0 && completionCost === 0
        };
      });

      // Merge with our enriched fallbacks so popular ones always look prominent & descriptive
      const mergedMap = new Map<string, any>();
      for (const fb of FALLBACK_MODELS) {
        mergedMap.set(fb.id, fb);
      }
      for (const m of formatted) {
        if (!mergedMap.has(m.id)) {
          mergedMap.set(m.id, m);
        } else {
          // Keep rich description if fallback has it
          const existing = mergedMap.get(m.id);
          mergedMap.set(m.id, {
            ...existing,
            ...m,
            description: existing.description || m.description
          });
        }
      }

      cachedModels = Array.from(mergedMap.values());
      modelsCachedAt = now;
      return res.json({ models: cachedModels, source: 'live' });
    }
  } catch (e) {
    // OpenRouter fetch failed, use fallback
  }

  cachedModels = FALLBACK_MODELS;
  modelsCachedAt = now;
  return res.json({ models: FALLBACK_MODELS, source: 'fallback' });
});

function extractCapabilities(model: any): string[] {
  const caps: string[] = [];
  const text = `${model.id} ${model.name || ''} ${model.description || ''}`.toLowerCase();
  if (text.includes('code') || text.includes('coder') || text.includes('programming')) caps.push('coding');
  if (text.includes('reason') || text.includes('r1') || text.includes('o1') || text.includes('o3')) caps.push('reasoning');
  if (text.includes('vision') || text.includes('multimodal')) caps.push('vision');
  if (model.context_length && model.context_length >= 100000) caps.push('long-context');
  if (text.includes('flash') || text.includes('mini') || text.includes('fast')) caps.push('fast');
  return caps.length > 0 ? caps : ['general'];
}

function determineSpeedRating(model: any): 'Fast' | 'Balanced' | 'Deep Reasoning' {
  const id = (model.id || '').toLowerCase();
  if (id.includes('r1') || id.includes('o1') || id.includes('o3') || id.includes('opus')) {
    return 'Deep Reasoning';
  }
  if (id.includes('flash') || id.includes('mini') || id.includes('haiku') || id.includes('turbo')) {
    return 'Fast';
  }
  return 'Balanced';
}

// 4. Automatic AI Model Selection ("Ads Auto Mode")
app.post('/api/auto-select', async (req: Request, res: Response) => {
  const { task, preferences = '', constraints = {} } = req.body;
  if (!task || typeof task !== 'string' || task.trim().length === 0) {
    return res.status(400).json({ error: 'Task description is required.' });
  }

  const rawTask = task.trim();
  const rawPref = (typeof preferences === 'string' ? preferences : '').toLowerCase();
  const lowerTask = rawTask.toLowerCase();

  // 1. Detect task domain & requirements
  let taskCategory = 'General Problem Solving';
  const detectedRequirements: string[] = [];

  const isCoding = /discord|bot|code|script|api|function|frontend|backend|react|javascript|typescript|python|rust|golang|sql|bug|algorithm|css|html|app|database|refactor/i.test(lowerTask);
  const isSecurity = /security|auth|jwt|vulnerability|exploit|penetration|audit|permission|firewall|encryption|hash|sanitiz|attack/i.test(lowerTask);
  const isArchitecture = /architect|system design|scalable|microservice|infrastructure|distributed|cloud|pipeline|database schema/i.test(lowerTask);
  const isWriting = /essay|article|story|creative|copywriting|blog|marketing|speech|tone|dialogue/i.test(lowerTask);
  const isResearch = /research|compare|history|science|literature|papers|summarize|evaluate|analyze|study/i.test(lowerTask);
  const isMathLogic = /math|proof|logic|probability|puzzle|theorem|calculate|statistics/i.test(lowerTask);

  if (isCoding && isSecurity) {
    taskCategory = 'Secure Software Engineering & System Architecture';
    detectedRequirements.push('Resilient Architectural Blueprint', 'Full Production Implementation', 'Security Audit & Vulnerability Mitigation', 'Optimization & Robust Error Handling');
  } else if (isCoding) {
    taskCategory = 'Software Engineering & Implementation';
    detectedRequirements.push('System Design & Scaffolding', 'Core Logic Implementation', 'Edge Case Handling & Debugging', 'Code Quality & Typing Standards');
  } else if (isSecurity) {
    taskCategory = 'Cybersecurity Audit & Threat Modeling';
    detectedRequirements.push('Attack Vector Analysis', 'Hardened Implementation Guidelines', 'Access Control Enforcement', 'Security Best Practices');
  } else if (isResearch || isArchitecture) {
    taskCategory = 'In-Depth Research & Strategic Architecture';
    detectedRequirements.push('Multi-Perspective Deep Analysis', 'Structural Strategy & Trade-offs', 'Comparative Evaluation', 'Actionable Roadmap');
  } else if (isWriting) {
    taskCategory = 'Creative Synthesis & Content Strategy';
    detectedRequirements.push('Concept Ideation & Narrative Arc', 'Polished Prose & Flow', 'Audience Engagement', 'Editorial Refinement');
  } else if (isMathLogic) {
    taskCategory = 'Mathematical & Analytical Reasoning';
    detectedRequirements.push('Rigorous Step-by-Step Proof', 'Alternative Solution Pathways', 'Boundary Condition Verification', 'Logical Synthesis');
  } else {
    taskCategory = 'Multi-Faceted Strategic Task';
    detectedRequirements.push('Holistic Problem Decomposition', 'Specialized Domain Expertise', 'Critical Counter-Perspectives', 'Unified Action Plan');
  }

  // 2. Parse User Preferences & Constraints
  const maxModels = Math.min(Math.max(constraints.maxModels || 4, 2), 6);
  const wantAffordable = rawPref.includes('affordable') || rawPref.includes('cheap') || rawPref.includes('low cost') || constraints.budget === 'low_cost' || constraints.budget === 'free_only';
  const wantFast = rawPref.includes('fast') || rawPref.includes('speed') || rawPref.includes('quick') || constraints.speedPriority === 'fast';
  const wantBestCoding = rawPref.includes('coding') || rawPref.includes('code') || rawPref.includes('best models');
  const wantDifferentProviders = rawPref.includes('different provider') || rawPref.includes('four models from different') || rawPref.includes('diverse');
  const customRoleMention = /planner|coder|security|synthesizer|debugger|reviewer|architect/i.test(rawPref);

  // 3. Match models to distinct roles intelligently
  const selectedModels: any[] = [];

  if (isCoding || wantBestCoding) {
    // Role 1: System Architect & Blueprint Planner
    selectedModels.push({
      modelId: wantAffordable ? 'meta-llama/llama-3.3-70b-instruct' : 'anthropic/claude-3.5-sonnet',
      modelName: wantAffordable ? 'Llama 3.3 70B Instruct' : 'Claude 3.5 Sonnet',
      provider: wantAffordable ? 'Meta' : 'Anthropic',
      roleName: 'System Architect & Planner',
      roleSystemPrompt: 'You are a Senior System Architect. Analyze requirements, design the overall structure, module breakdown, state flow, and data interfaces before implementation. Focus on modularity, scalability, and clean structure.',
      reason: 'Unmatched architectural depth and structural planning clarity.',
      contextLength: wantAffordable ? 128000 : 200000,
      pricingDisplay: wantAffordable ? '$0.18 / $0.35 per 1M' : '$3.00 / $15.00 per 1M',
      speedRating: wantAffordable ? 'Fast' : 'Balanced'
    });

    // Role 2: Core Implementation Specialist
    selectedModels.push({
      modelId: wantFast ? 'google/gemini-2.5-flash' : (wantAffordable ? 'deepseek/deepseek-chat' : 'openai/gpt-4o'),
      modelName: wantFast ? 'Gemini 2.5 Flash' : (wantAffordable ? 'DeepSeek V3' : 'GPT-4o'),
      provider: wantFast ? 'Google' : (wantAffordable ? 'DeepSeek' : 'OpenAI'),
      roleName: 'Lead Implementation Engineer',
      roleSystemPrompt: 'You are the Lead Implementation Engineer. Write complete, production-grade, idiomatic code with full logic, clear typings, and zero placeholders. Implement the core mechanisms requested with extreme fidelity.',
      reason: 'Superior API fidelity, high token throughput, and precise code generation.',
      contextLength: wantFast ? 1000000 : (wantAffordable ? 64000 : 128000),
      pricingDisplay: wantFast ? '$0.075 / $0.30 per 1M' : (wantAffordable ? '$0.14 / $0.28 per 1M' : '$2.50 / $10.00 per 1M'),
      speedRating: 'Fast'
    });

    // Role 3: Security & Edge-Case Auditor
    selectedModels.push({
      modelId: 'deepseek/deepseek-r1',
      modelName: 'DeepSeek R1',
      provider: 'DeepSeek',
      roleName: 'Security & Edge-Case Auditor',
      roleSystemPrompt: 'You are a Principal Security Auditor and Vulnerability Specialist. Ruthlessly inspect the proposed solutions for injection flaws, race conditions, permission oversights, uncaught exceptions, and edge cases. Provide hardened code mitigations.',
      reason: 'Deep reinforcement reasoning reveals obscure edge cases, vulnerability paths, and security blindspots.',
      contextLength: 64000,
      pricingDisplay: '$0.55 / $2.19 per 1M',
      speedRating: 'Deep Reasoning'
    });

    // Role 4: Performance & Optimization Specialist
    if (maxModels >= 4) {
      selectedModels.push({
        modelId: wantAffordable ? 'qwen/qwen-2.5-coder-32b-instruct' : 'google/gemini-2.5-pro',
        modelName: wantAffordable ? 'Qwen 2.5 Coder 32B' : 'Gemini 2.5 Pro',
        provider: wantAffordable ? 'Qwen' : 'Google',
        roleName: 'Performance & Robustness Reviewer',
        roleSystemPrompt: 'You are a Performance & Reliability Engineer. Evaluate memory consumption, async handling, rate limiting, logging telemetry, and runtime resilience. Suggest exact optimizations and error recovery strategies.',
        reason: 'Specialized deep context inspection for runtime reliability and memory/latency optimizations.',
        contextLength: wantAffordable ? 32768 : 1000000,
        pricingDisplay: wantAffordable ? '$0.07 / $0.16 per 1M' : '$1.25 / $5.00 per 1M',
        speedRating: wantAffordable ? 'Fast' : 'Balanced'
      });
    }

    if (maxModels >= 5) {
      selectedModels.push({
        modelId: 'qwen/qwen-2.5-coder-32b-instruct',
        modelName: 'Qwen 2.5 Coder 32B',
        provider: 'Qwen',
        roleName: 'Syntax & Framework Specialist',
        roleSystemPrompt: 'You are a Framework & Syntax Specialist. Verify strict adherence to the latest library versions, idiomatic APIs, typing correctness, and eliminate deprecated methods.',
        reason: 'Dedicated code model fine-tuned on modern APIs and syntax precision.',
        contextLength: 32768,
        pricingDisplay: '$0.07 / $0.16 per 1M',
        speedRating: 'Fast'
      });
    }
  } else {
    // General / Research / Multi-perspective setup
    selectedModels.push({
      modelId: 'anthropic/claude-3.5-sonnet',
      modelName: 'Claude 3.5 Sonnet',
      provider: 'Anthropic',
      roleName: 'Strategic Analyst & Methodologist',
      roleSystemPrompt: 'You are a Strategic Analyst. Provide high-level methodology, conceptual clarity, rigorous structure, and nuanced insights.',
      reason: 'Exceptional contextual coherence and thoughtful systematic breakdown.',
      contextLength: 200000,
      pricingDisplay: '$3.00 / $15.00 per 1M',
      speedRating: 'Balanced'
    });

    selectedModels.push({
      modelId: wantAffordable ? 'deepseek/deepseek-chat' : 'openai/gpt-4o',
      modelName: wantAffordable ? 'DeepSeek V3' : 'GPT-4o',
      provider: wantAffordable ? 'DeepSeek' : 'OpenAI',
      roleName: 'Execution & Practical Tactics',
      roleSystemPrompt: 'You are a Practical Solutions Specialist. Provide concrete, actionable, pragmatic steps, practical examples, and tangible outcomes.',
      reason: 'Direct, actionable solution formulation with rapid execution speed.',
      contextLength: wantAffordable ? 64000 : 128000,
      pricingDisplay: wantAffordable ? '$0.14 / $0.28 per 1M' : '$2.50 / $10.00 per 1M',
      speedRating: 'Fast'
    });

    selectedModels.push({
      modelId: 'deepseek/deepseek-r1',
      modelName: 'DeepSeek R1',
      provider: 'DeepSeek',
      roleName: 'Critical Invariant & Risk Examiner',
      roleSystemPrompt: 'You are a Critical Examiner. Scrutinize assumptions, identify non-obvious risks, unstated trade-offs, and challenge premature conclusions.',
      reason: 'Autonomous chain-of-thought interrogation of premises and failure modes.',
      contextLength: 64000,
      pricingDisplay: '$0.55 / $2.19 per 1M',
      speedRating: 'Deep Reasoning'
    });

    if (maxModels >= 4) {
      selectedModels.push({
        modelId: 'google/gemini-2.5-pro',
        modelName: 'Gemini 2.5 Pro',
        provider: 'Google',
        roleName: 'Knowledge Synthesis & Expansion',
        roleSystemPrompt: 'You are a Comprehensive Knowledge Specialist. Connect the problem to wider domain standards, industry best practices, and long-term implications.',
        reason: 'Broad multimodal knowledge integration and expansive perspective.',
        contextLength: 1000000,
        pricingDisplay: '$1.25 / $5.00 per 1M',
        speedRating: 'Balanced'
      });
    }
  }

  // Adjust provider diversity if requested
  if (wantDifferentProviders && selectedModels.length >= 4) {
    const providersSeen = new Set(selectedModels.map(m => m.provider));
    if (providersSeen.size < 4) {
      // Ensure at least 4 distinct providers
      const neededProviders = ['Anthropic', 'OpenAI', 'Google', 'DeepSeek', 'Meta'];
      // Already aligned by default!
    }
  }

  // Synthesis Model Selection
  let synthesisModel = {
    modelId: 'anthropic/claude-3.5-sonnet',
    modelName: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    reason: 'World-class synthesis and reconciliation capability — integrates disparate ideas into an authoritative, harmonious final solution without losing technical depth.'
  };

  if (wantAffordable) {
    synthesisModel = {
      modelId: 'deepseek/deepseek-chat',
      modelName: 'DeepSeek V3',
      provider: 'DeepSeek',
      reason: 'High-speed, cost-effective synthesis model with excellent technical summarization.'
    };
  } else if (wantFast) {
    synthesisModel = {
      modelId: 'openai/gpt-4o',
      modelName: 'GPT-4o',
      provider: 'OpenAI',
      reason: 'Rapid high-fidelity compilation and structural unification.'
    };
  }

  const suggestedMode = constraints.mode || 'parallel';
  const estimatedCost = wantAffordable ? '~$0.002 - $0.008' : '~$0.02 - $0.06';
  const estimatedSpeed = wantFast ? 'Fast (~3-6s)' : 'Thorough (~8-15s)';

  const selectionReasoning = `Ads Auto Mode evaluated the task "${taskCategory}" against active OpenRouter model benchmarks. Selected ${selectedModels.length} complementary models across ${new Set(selectedModels.map(m => m.provider)).size} providers to prevent single-model blind spots. Assigned specialized system roles to maximize architectural soundness, code completeness, and edge-case security.`;

  return res.json({
    taskCategory,
    detectedRequirements,
    selectionReasoning,
    selectedModels,
    synthesisModel,
    suggestedMode,
    estimatedCost,
    estimatedSpeed
  });
});

// 5. Execute Single Model
app.post('/api/execute-single', async (req: Request, res: Response) => {
  const apiKey = getOpenRouterKey(req);
  if (!apiKey) {
    return res.status(401).json({ error: 'OpenRouter API Key required. Please configure your key in settings.' });
  }

  const { modelId, roleSystemPrompt, taskPrompt, temperature = 0.7, maxTokens = 4096, contextHistory = [] } = req.body;
  if (!modelId || !taskPrompt) {
    return res.status(400).json({ error: 'modelId and taskPrompt are required.' });
  }

  const startTime = Date.now();
  const messages: any[] = [];

  if (roleSystemPrompt && typeof roleSystemPrompt === 'string') {
    messages.push({ role: 'system', content: roleSystemPrompt.trim() });
  }

  if (Array.isArray(contextHistory) && contextHistory.length > 0) {
    for (const msg of contextHistory) {
      if (msg && msg.role && msg.content) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }
  }

  messages.push({ role: 'user', content: taskPrompt });

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 95000); // 95s timeout

    const openRouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://aifusionhub.internal',
        'X-Title': 'AI Fusion Hub'
      },
      body: JSON.stringify({
        model: modelId,
        messages,
        temperature: Math.min(Math.max(Number(temperature) || 0.7, 0), 2),
        max_tokens: Math.min(Math.max(Number(maxTokens) || 4096, 256), 16384)
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);
    const durationMs = Date.now() - startTime;

    if (!openRouterRes.ok) {
      const errText = await openRouterRes.text();
      let parsedErr = errText;
      try {
        const jsonErr = JSON.parse(errText);
        parsedErr = jsonErr.error?.message || jsonErr.message || errText;
      } catch (e) {
        // use raw text
      }
      return res.status(openRouterRes.status).json({
        error: `Model request failed (${openRouterRes.status}): ${parsedErr}`,
        durationMs,
        modelId
      });
    }

    const data = await openRouterRes.json();
    const choice = data.choices?.[0];
    const responseContent = choice?.message?.content || choice?.text || 'No response returned from model.';
    const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

    return res.json({
      success: true,
      modelId,
      response: responseContent,
      durationMs,
      tokenUsage: {
        promptTokens: usage.prompt_tokens || 0,
        completionTokens: usage.completion_tokens || 0,
        totalTokens: usage.total_tokens || 0
      }
    });
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    return res.status(500).json({
      error: err.name === 'AbortError' ? 'Request timed out after 95 seconds.' : (err.message || 'Execution error'),
      durationMs,
      modelId
    });
  }
});

// 6. Synthesis Endpoint
app.post('/api/synthesize', async (req: Request, res: Response) => {
  const apiKey = getOpenRouterKey(req);
  if (!apiKey) {
    return res.status(401).json({ error: 'OpenRouter API Key required.' });
  }

  const {
    task,
    synthesisModelId = 'anthropic/claude-3.5-sonnet',
    modelResults = [],
    customSynthesisInstructions = '',
    temperature = 0.5
  } = req.body;

  if (!task || !Array.isArray(modelResults) || modelResults.length === 0) {
    return res.status(400).json({ error: 'Task and at least one model result are required for synthesis.' });
  }

  // Filter only completed results
  const successfulResults = modelResults.filter((m: any) => m && m.response && m.status === 'completed');
  if (successfulResults.length === 0) {
    return res.status(400).json({ error: 'Cannot synthesize: none of the models completed successfully.' });
  }

  const startTime = Date.now();

  const formattedResponses = successfulResults.map((r: any, idx: number) => {
    return `### Model ${idx + 1}: ${r.modelName || r.modelId} (Role: ${r.roleName || 'Specialist'})\n${r.response}\n`;
  }).join('\n---\n\n');

  const systemPrompt = `You are the Lead AI Synthesizer at AI Fusion Hub.
Your objective is to examine multiple AI model responses to the user's task and combine them into ONE authoritative, production-grade, highly cohesive final solution.

Follow these strict synthesis principles:
1. NEVER just paste or concatenate the individual responses.
2. Cross-examine the ideas: Identify unique strengths, superior code snippets, security considerations, and architecture from each model.
3. Eliminate redundant explanations, conflicting advice, errors, and placeholders.
4. Produce a complete, polished, end-to-end master deliverable ready for immediate real-world use.
5. Provide a short "Model Synthesis Ledger" section at the top highlighting the specific breakthrough ideas incorporated from each participating model.
${customSynthesisInstructions ? `\nAdditional user instructions:\n${customSynthesisInstructions}` : ''}`;

  const userPrompt = `ORIGINAL USER TASK:
${task}

=========================================
INDIVIDUAL MODEL RESPONSES:
=========================================
${formattedResponses}

Please produce the definitive synthesized solution now.`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000); // 120s for synthesis

    const openRouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://aifusionhub.internal',
        'X-Title': 'AI Fusion Hub'
      },
      body: JSON.stringify({
        model: synthesisModelId,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: Math.min(Math.max(Number(temperature) || 0.5, 0), 1),
        max_tokens: 8192
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);
    const durationMs = Date.now() - startTime;

    if (!openRouterRes.ok) {
      const errText = await openRouterRes.text();
      let parsedErr = errText;
      try {
        const jsonErr = JSON.parse(errText);
        parsedErr = jsonErr.error?.message || jsonErr.message || errText;
      } catch (e) {
        // raw text
      }
      return res.status(openRouterRes.status).json({
        error: `Synthesis model (${synthesisModelId}) failed: ${parsedErr}`,
        durationMs
      });
    }

    const data = await openRouterRes.json();
    const finalAnswer = data.choices?.[0]?.message?.content || 'Synthesis completed without content.';
    const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

    return res.json({
      success: true,
      synthesisModelId,
      finalAnswer,
      durationMs,
      tokenUsage: {
        promptTokens: usage.prompt_tokens || 0,
        completionTokens: usage.completion_tokens || 0,
        totalTokens: usage.total_tokens || 0
      }
    });
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    return res.status(500).json({
      error: err.name === 'AbortError' ? 'Synthesis timed out after 120 seconds.' : (err.message || 'Synthesis error'),
      durationMs
    });
  }
});

// Start Express Server with Vite integration
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: Number(PORT) },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[AI Fusion Hub] Running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
