const PROVIDERS = {
  // Google AI Studio - Gemini 4 (best overall - PRIMARY)
  gemini: {
    name: "Gemini 4 Flash",
    model: "gemini-2.5-flash-preview-04-17",
    url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    keyEnv: "GEMINI_API_KEY",
    dailyLimit: 1500,
    contextLength: 1_000_000,
    supportsVision: true,
    provider: "google",
    family: "chat",
    priority: 1, // Primary orchestrator
  },

  // Gemma 3 4B - Free on OpenRouter (PRIMARY FALLBACK)
  gemma_3_4b: {
    name: "Gemma 3 4B (Free)",
    model: "google/gemma-3-4b-it:free",
    url: "https://openrouter.ai/api/v1/chat/completions",
    keyEnv: "OPENROUTER_API_KEY",
    dailyLimit: 200,
    contextLength: 32_768,
    supportsVision: true,
    provider: "google",
    family: "chat",
    priority: 2, // Primary fallback
  },

  // Liquid AI - LFM2.5 Series (Free on OpenRouter)
  liquid_lfm_2_5_1b_thinking: {
    name: "LFM-2.5-1B Thinking (Free)",
    model: "liquid/lfm-2.5-1.2b-thinking:free",
    url: "https://openrouter.ai/api/v1/chat/completions",
    keyEnv: "OPENROUTER_API_KEY",
    dailyLimit: 200,
    contextLength: 32_768,
    supportsVision: false,
    provider: "liquid",
    family: "reasoning",
    priority: 3,
  },
  liquid_lfm_2_24b: {
    name: "LFM-2 24B",
    model: "liquid/lfm-2-24b-a2b:free",
    url: "https://openrouter.ai/api/v1/chat/completions",
    keyEnv: "OPENROUTER_API_KEY",
    dailyLimit: 200,
    contextLength: 1_000_000,
    supportsVision: false,
    provider: "liquid",
    family: "foundation",
    priority: 4,
  },

  // Groq - Llama 3.3 (fastest inference)
  groq: {
    name: "Llama 3.3 70B (Groq)",
    model: "llama-3.3-70b-versatile",
    url: "https://api.groq.com/openai/v1/chat/completions",
    keyEnv: "GROQ_API_KEY",
    dailyLimit: 50,
    contextLength: 128_000,
    supportsVision: false,
    provider: "groq",
    family: "chat",
    priority: 5,
  },

  // Mistral AI
  mistral: {
    name: "Mistral Small",
    model: "mistral-small-latest",
    url: "https://api.mistral.ai/v1/chat/completions",
    keyEnv: "MISTRAL_API_KEY",
    dailyLimit: 100,
    contextLength: 128_000,
    supportsVision: false,
    provider: "mistral",
    family: "chat",
  },

  // OpenRouter - All Free Models Aggregator
  // Qwen Series (Alibaba)
  qwen_qwq_32b: {
    name: "QwQ 32B (Reasoning)",
    model: "qwen/qwq-32b:free",
    url: "https://openrouter.ai/api/v1/chat/completions",
    keyEnv: "OPENROUTER_API_KEY",
    dailyLimit: 200,
    contextLength: 131_072,
    supportsVision: false,
    provider: "qwen",
    family: "reasoning",
  },
  qwen_coder_32b: {
    name: "Qwen Coder 32B",
    model: "qwen/qwen2.5-coder-32b-instruct:free",
    url: "https://openrouter.ai/api/v1/chat/completions",
    keyEnv: "OPENROUTER_API_KEY",
    dailyLimit: 200,
    contextLength: 32_768,
    supportsVision: false,
    provider: "qwen",
    family: "code",
  },

  // DeepSeek Series
  deepseek_r1_distill_32b: {
    name: "DeepSeek R1 Distill 32B",
    model: "deepseek/deepseek-r1-distill-qwen-32b:free",
    url: "https://openrouter.ai/api/v1/chat/completions",
    keyEnv: "OPENROUTER_API_KEY",
    dailyLimit: 200,
    contextLength: 128_000,
    supportsVision: false,
    provider: "deepseek",
    family: "reasoning",
  },
  deepseek_chat: {
    name: "DeepSeek Chat",
    model: "deepseek/deepseek-chat:free",
    url: "https://openrouter.ai/api/v1/chat/completions",
    keyEnv: "OPENROUTER_API_KEY",
    dailyLimit: 200,
    contextLength: 64_000,
    supportsVision: false,
    provider: "deepseek",
    family: "chat",
  },

  // MiniMax (via OpenRouter)
  minimax_text_01: {
    name: "MiniMax Text-01",
    model: "minimax/minimax-text-01:free",
    url: "https://openrouter.ai/api/v1/chat/completions",
    keyEnv: "OPENROUTER_API_KEY",
    dailyLimit: 200,
    contextLength: 1_000_000,
    supportsVision: false,
    provider: "minimax",
    family: "chat",
  },

  // Meta Llama Series
  llama_3_3_70b: {
    name: "Llama 3.3 70B",
    model: "meta-llama/llama-3.3-70b-instruct:free",
    url: "https://openrouter.ai/api/v1/chat/completions",
    keyEnv: "OPENROUTER_API_KEY",
    dailyLimit: 200,
    contextLength: 128_000,
    supportsVision: false,
    provider: "meta",
    family: "chat",
  },
  llama_3_1_8b: {
    name: "Llama 3.1 8B",
    model: "meta-llama/llama-3.1-8b-instruct:free",
    url: "https://openrouter.ai/api/v1/chat/completions",
    keyEnv: "OPENROUTER_API_KEY",
    dailyLimit: 200,
    contextLength: 128_000,
    supportsVision: false,
    provider: "meta",
    family: "chat",
  },

  // Mistral (via OpenRouter)
  mistral_7b: {
    name: "Mistral 7B",
    model: "mistralai/mistral-7b-instruct:free",
    url: "https://openrouter.ai/api/v1/chat/completions",
    keyEnv: "OPENROUTER_API_KEY",
    dailyLimit: 200,
    contextLength: 32_768,
    supportsVision: false,
    provider: "mistral",
    family: "chat",
  },

  // Google Gemma Series (via OpenRouter)
  gemma_3_27b: {
    name: "Gemma 3 27B",
    model: "google/gemma-3-27b-it:free",
    url: "https://openrouter.ai/api/v1/chat/completions",
    keyEnv: "OPENROUTER_API_KEY",
    dailyLimit: 200,
    contextLength: 131_072,
    supportsVision: true,
    provider: "google",
    family: "chat",
  },
  gemma_2_27b: {
    name: "Gemma 2 27B",
    model: "google/gemma-2-27b-it:free",
    url: "https://openrouter.ai/api/v1/chat/completions",
    keyEnv: "OPENROUTER_API_KEY",
    dailyLimit: 200,
    contextLength: 131_072,
    supportsVision: true,
    provider: "google",
    family: "chat",
  },
  gemma_2_9b: {
    name: "Gemma 2 9B",
    model: "google/gemma-2-9b-it:free",
    url: "https://openrouter.ai/api/v1/chat/completions",
    keyEnv: "OPENROUTER_API_KEY",
    dailyLimit: 200,
    contextLength: 131_072,
    supportsVision: false,
    provider: "google",
    family: "chat",
  },

  // ByteDance (Seed)
  bytedance_seedance: {
    name: "Seedance 1.5 Pro",
    model: "bytedance/seedance-1-5-pro:free",
    url: "https://openrouter.ai/api/v1/chat/completions",
    keyEnv: "OPENROUTER_API_KEY",
    dailyLimit: 200,
    contextLength: 64_000,
    supportsVision: true,
    provider: "bytedance",
    family: "video",
  },

  // 01.AI (Yi)
  yi_coder_34b: {
    name: "Yi Coder 34B",
    model: "01-ai/yi-coder-34b-chat:free",
    url: "https://openrouter.ai/api/v1/chat/completions",
    keyEnv: "OPENROUTER_API_KEY",
    dailyLimit: 200,
    contextLength: 32_768,
    supportsVision: false,
    provider: "01-ai",
    family: "code",
  },
  yi_chat_34b: {
    name: "Yi Chat 34B",
    model: "01-ai/yi-chat-34b:free",
    url: "https://openrouter.ai/api/v1/chat/completions",
    keyEnv: "OPENROUTER_API_KEY",
    dailyLimit: 200,
    contextLength: 32_768,
    supportsVision: false,
    provider: "01-ai",
    family: "chat",
  },

  // Cohere
  command_r_plus: {
    name: "Command R+",
    model: "cohere/command-r-plus:free",
    url: "https://openrouter.ai/api/v1/chat/completions",
    keyEnv: "OPENROUTER_API_KEY",
    dailyLimit: 200,
    contextLength: 128_000,
    supportsVision: false,
    provider: "cohere",
    family: "chat",
  },
  command_r: {
    name: "Command R",
    model: "cohere/command-r:free",
    url: "https://openrouter.ai/api/v1/chat/completions",
    keyEnv: "OPENROUTER_API_KEY",
    dailyLimit: 200,
    contextLength: 128_000,
    supportsVision: false,
    provider: "cohere",
    family: "chat",
  },

  // Stability AI
  stable_chat: {
    name: "Stable Chat",
    model: "stabilityai/stable-chat:free",
    url: "https://openrouter.ai/api/v1/chat/completions",
    keyEnv: "OPENROUTER_API_KEY",
    dailyLimit: 200,
    contextLength: 32_768,
    supportsVision: false,
    provider: "stability",
    family: "chat",
  },

  // NVIDIA (via OpenRouter)
  nvidia_nemotron_8b: {
    name: "Nemotron Nano 8B",
    model: "nvidia/llama-3.1-nemotron-nano-8b-v1:free",
    url: "https://openrouter.ai/api/v1/chat/completions",
    keyEnv: "OPENROUTER_API_KEY",
    dailyLimit: 200,
    contextLength: 128_000,
    supportsVision: false,
    provider: "nvidia",
    family: "chat",
  },

  // Anthropic (via OpenRouter) - Limited free
  claude_3_haiku: {
    name: "Claude 3 Haiku",
    model: "anthropic/claude-3-haiku:free",
    url: "https://openrouter.ai/api/v1/chat/completions",
    keyEnv: "OPENROUTER_API_KEY",
    dailyLimit: 50,
    contextLength: 200_000,
    supportsVision: true,
    provider: "anthropic",
    family: "chat",
  },

  // OpenAI (via OpenRouter) - Limited free
  gpt_4o_mini: {
    name: "GPT-4o Mini",
    model: "openai/gpt-4o-mini:free",
    url: "https://openrouter.ai/api/v1/chat/completions",
    keyEnv: "OPENROUTER_API_KEY",
    dailyLimit: 50,
    contextLength: 128_000,
    supportsVision: true,
    provider: "openai",
    family: "chat",
  },

  //NousResearch
  hermes_3_llama_8b: {
    name: "Hermes 3 Llama 8B",
    model: "nousresearch/hermes-3-llama-8b:free",
    url: "https://openrouter.ai/api/v1/chat/completions",
    keyEnv: "OPENROUTER_API_KEY",
    dailyLimit: 200,
    contextLength: 128_000,
    supportsVision: false,
    provider: "nous",
    family: "chat",
  },

  // Qdrant
  qdrant_rerank: {
    name: "Qdrant Reranker",
    model: "qdrant/qdrant-rerank-mistral:free",
    url: "https://openrouter.ai/api/v1/chat/completions",
    keyEnv: "OPENROUTER_API_KEY",
    dailyLimit: 200,
    contextLength: 32_768,
    supportsVision: false,
    provider: "qdrant",
    family: "rerank",
  },

  // Flashcards
  flashcards: {
    name: "Flashcards",
    model: "triplex-ai/flashcards:free",
    url: "https://openrouter.ai/api/v1/chat/completions",
    keyEnv: "OPENROUTER_API_KEY",
    dailyLimit: 200,
    contextLength: 32_768,
    supportsVision: false,
    provider: "triplex",
    family: "chat",
  },
} as const;

export type ProviderName = keyof typeof PROVIDERS;

export interface ProviderConfig {
  name: string;
  model: string;
  url: string;
  keyEnv: string;
  dailyLimit: number;
  contextLength: number;
  supportsVision: boolean;
  provider: string;
  family?: string;
  category?: string;
  priority?: number;
}

export interface CouncilResponse {
  provider: ProviderName;
  content: string;
  usage: number;
  success: boolean;
  error?: string;
}

export interface CouncilResult {
  synthesis: string;
  sources: Array<{ title: string; url: string; snippet: string }>;
  debate: CouncilResponse[];
}

const OPENROUTER_HEADERS = {
  "HTTP-Referer": "https://sovereign-council.local",
  "X-Title": "Sovereign Council",
};

async function callProvider(
  provider: ProviderName,
  apiKey: string,
  messages: Array<{ role: string; content: string }>,
  stream = false
): Promise<CouncilResponse> {
  const config = PROVIDERS[provider];
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  if (config.url.includes("openrouter.ai")) {
    Object.assign(headers, OPENROUTER_HEADERS);
  }

  const body = {
    model: config.model,
    messages,
    temperature: 0.3,
    max_tokens: 4096,
    stream,
  };

  const res = await fetch(config.url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${provider} API error ${res.status}: ${err}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { total_tokens?: number };
  };
  const content = data.choices?.[0]?.message?.content ?? "";
  const usage = data.usage?.total_tokens ?? 0;

  return { provider, content, usage, success: true };
}

export async function councilDebate(
  query: string,
  groundedContext: string,
  keys: Record<ProviderName, string | undefined>
): Promise<CouncilResponse[]> {
  const debatePrompt = `You are a member of the Sovereign Council. Analyze the following search results and user query.

USER QUERY: ${query}

GROUNDING DATA:
${groundedContext}

Your task:
1. Extract the 3-5 most important facts from the search results
2. Identify any contradictions or conflicting information
3. Provide a concise analysis with inline citations to source numbers
4. Be objective - if the data is insufficient, say so clearly

Format your response in markdown.`;

  const activeProviders = (Object.keys(keys) as ProviderName[]).filter(
    (p) => keys[p]
  );

  if (activeProviders.length === 0) {
    return [{
      provider: "gemini",
      content: "No API keys configured. Please add your API keys in Settings to use the Council.",
      usage: 0,
      success: false,
      error: "No API keys configured",
    }];
  }

  const messages = [
    { role: "system" as const, content: debatePrompt },
    { role: "user" as const, content: query },
  ];

  const results = await Promise.allSettled(
    activeProviders.map(async (provider) => {
      return callProvider(provider, keys[provider]!, messages);
    })
  );

  return results.map((r, i) => {
    if (r.status === "fulfilled") return r.value;
    return {
      provider: activeProviders[i]!,
      content: "",
      usage: 0,
      success: false,
      error: (r.reason as Error)?.message ?? "Unknown error",
    };
  });
}

export async function synthesizeWithGemma(
  query: string,
  debate: CouncilResponse[],
  groundedContext: string,
  geminiKey?: string,
  openrouterKey?: string
): Promise<string> {
  const successfulDebate = debate.filter((d) => d.success);
  const debateSummary = successfulDebate
    .map((d) => `## ${PROVIDERS[d.provider]?.name || d.provider}:\n${d.content}`)
    .join("\n\n");

  const synthesisPrompt = `You are the Chief Synthesizer of the Sovereign Council. Your role is to produce the definitive answer by combining insights from multiple AI models.

USER QUERY: ${query}

GROUNDING DATA:
${groundedContext}

COUNCIL DEBATE RESULTS:
${debateSummary}

SYNTHESIS RULES:
1. Combine the strongest points from each model's analysis
2. Use inline citations [1], [2], [3] referencing the numbered sources in the grounding data
3. Be objective, precise, and comprehensive
4. If models disagree, present both perspectives and explain why
5. Never hallucinate facts not present in the grounding data or council analysis
6. Format the response in clean markdown
7. End with a "Sources" section listing all referenced sources

Write the final synthesized response now:`;

  const messages = [
    { role: "system" as const, content: synthesisPrompt },
    { role: "user" as const, content: query },
  ];

  // Priority 1: Try Gemini 4 (best overall)
  if (geminiKey) {
    try {
      const config = PROVIDERS.gemini;
      const res = await fetch(config.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${geminiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages,
          temperature: 0.2,
          max_tokens: 4096,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const content = data.choices?.[0]?.message?.content;
        if (content) return content;
      }
    } catch (e) {
      console.error("Gemini synthesis failed:", e);
    }
  }

  // Priority 2: Try Gemma 3 4B (free on OpenRouter) - Free fallback
  if (openrouterKey) {
    try {
      const config = PROVIDERS.gemma_3_4b;
      const res = await fetch(config.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openrouterKey}`,
          "HTTP-Referer": "https://sovereign-council.local",
          "X-Title": "Sovereign Council",
        },
        body: JSON.stringify({
          model: config.model,
          messages,
          temperature: 0.2,
          max_tokens: 4096,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const content = data.choices?.[0]?.message?.content;
        if (content) return content;
      }
    } catch (e) {
      console.error("Gemma 3 4B synthesis failed:", e);
    }
  }

  // Priority 3: Try Liquid LFM-2.5-1B Thinking (free on OpenRouter)
  if (openrouterKey) {
    try {
      const config = PROVIDERS.liquid_lfm_2_5_1b_thinking;
      const res = await fetch(config.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openrouterKey}`,
          "HTTP-Referer": "https://sovereign-council.local",
          "X-Title": "Sovereign Council",
        },
        body: JSON.stringify({
          model: config.model,
          messages,
          temperature: 0.2,
          max_tokens: 4096,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const content = data.choices?.[0]?.message?.content;
        if (content) return content;
      }
    } catch (e) {
      console.error("Liquid LFM synthesis failed:", e);
    }
  }

  // Fallback to best debate response
  const bestDebate = successfulDebate[0];
  if (bestDebate) return bestDebate.content;

  // Return search results if no AI available
  if (groundedContext) {
    return `## Search Results Found

${groundedContext.slice(0, 2000)}

Please configure at least one API key in Settings to get a full AI synthesis.`;
  }

  return "No response available. Please configure an API key in Settings.";
}

export function getProviderConfig(name: ProviderName): ProviderConfig {
  return PROVIDERS[name];
}

export function getAllProviders(): ProviderConfig[] {
  return Object.values(PROVIDERS);
}

export function getProvidersByFamily(family: string): ProviderConfig[] {
  return Object.values(PROVIDERS).filter(p => p.family === family);
}

export function getProvidersByCapability(supportsVision: boolean): ProviderConfig[] {
  return Object.values(PROVIDERS).filter(p => p.supportsVision === supportsVision);
}

// Provider grouping for UI
export const PROVIDER_GROUPS = {
  "google": ["gemini", "gemma_3_27b", "gemma_2_27b", "gemma_2_9b"],
  "meta": ["llama_3_3_70b", "llama_3_1_8b"],
  "deepseek": ["deepseek_r1_distill_32b", "deepseek_chat"],
  "qwen": ["qwen_qwq_32b", "qwen_coder_32b"],
  "01-ai": ["yi_coder_34b", "yi_chat_34b"],
  "mistral": ["mistral", "mistral_7b"],
  "liquid": ["liquid_lfm_2_24b"],
  "anthropic": ["claude_3_haiku"],
  "openai": ["gpt_4o_mini"],
  "cohere": ["command_r_plus", "command_r"],
  "nvidia": ["nvidia_nemotron_8b"],
  "stability": ["stable_chat"],
  "nous": ["hermes_3_llama_8b"],
  "minimax": ["minimax_text_01"],
  "bytedance": ["bytedance_seedance"],
  "groq": ["groq"],
} as const;