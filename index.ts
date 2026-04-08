import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { auth } from "./auth";
import search from "./lib/search";
import { 
  councilDebate, 
  synthesizeWithGemma, 
  type ProviderName,
  getAllProviders 
} from "./lib/council";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import { keyLedger } from "./db/schema";

const app = new Hono();

app.on(["POST", "GET"], "/api/auth/*", async (c) => {
  return auth.handler(c.req.raw);
});
app.route("/api/search", search);

// Get all available models for the UI
app.get("/api/models", async (c) => {
  const providers = getAllProviders();
  return c.json(providers.map(p => ({
    id: Object.entries({
      gemini: "gemini", groq: "groq", mistral: "mistral",
      qwen_qwq_32b: "openrouter", deepseek_r1_distill_32b: "openrouter",
      llama_3_3_70b: "openrouter", gemma_3_27b: "openrouter",
      liquid_lfm_2_24b: "openrouter", minimax_text_01: "openrouter"
    }).find(([k]) => providers.some(p => 
      Object.keys({gemini: "gemini", groq: "groq", mistral: "mistral"}).includes(k)
    ))?.[0],
    name: p.name,
    provider: p.provider,
    family: p.family || "chat",
    contextLength: p.contextLength,
    supportsVision: p.supportsVision,
    dailyLimit: p.dailyLimit,
  })));
});

app.get("/api/keys", async (c) => {
  const keys = await db
    .select({
      id: keyLedger.id,
      provider: keyLedger.provider,
      dailyUsage: keyLedger.dailyUsage,
      dailyLimit: keyLedger.dailyLimit,
      isActive: keyLedger.isActive,
      lastReset: keyLedger.lastReset,
    })
    .from(keyLedger);

  const battery = keys.map((k) => ({
    ...k,
    percentage: Math.round(((k.dailyLimit - k.dailyUsage) / k.dailyLimit) * 100),
  }));

  return c.json(battery);
});

app.post("/api/keys", async (c) => {
  const { provider, apiKey } = await c.req.json();

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const existing = await db
    .select()
    .from(keyLedger)
    .where(and(eq(keyLedger.provider, provider)));

  if (existing.length > 0) {
    await db
      .update(keyLedger)
      .set({ apiKey, updatedAt: now, lastReset: today })
      .where(eq(keyLedger.id, existing[0]!.id));
    return c.json({ success: true, action: "updated" });
  }

  await db.insert(keyLedger).values({
    id: crypto.randomUUID(),
    provider,
    apiKey,
    dailyUsage: 0,
    dailyLimit: 1500,
    lastReset: today,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });

  return c.json({ success: true, action: "created" });
});

app.post("/api/council", async (c) => {
  const { query } = await c.req.json();

  if (!query) {
    return c.json({ error: "Query is required" }, 400);
  }

  const keys = await db.select().from(keyLedger);
  const keyMap: Record<string, string> = {};
  keys.forEach((k) => {
    if (k.isActive) keyMap[k.provider] = k.apiKey;
  });

  // Build provider keys from DB + env
  const providerKeys: Record<string, string | undefined> = {
    gemini: keyMap["gemini"] || Bun.env.GEMINI_API_KEY,
    groq: keyMap["groq"] || Bun.env.GROQ_API_KEY,
    mistral: keyMap["mistral"] || Bun.env.MISTRAL_API_KEY,
    openrouter: keyMap["openrouter"] || Bun.env.OPENROUTER_API_KEY,
    huggingface: keyMap["huggingface"] || Bun.env.HUGGINGFACE_TOKEN,
    together: keyMap["together"] || Bun.env.TOGETHER_API_KEY,
    nvidia: keyMap["nvidia"] || Bun.env.NVIDIA_API_KEY,
    tavily: keyMap["tavily"] || Bun.env.TAVILY_API_KEY,
    serper: keyMap["serper"] || Bun.env.SERPER_API_KEY,
  };

  // Multi-source search
  let context = "";
  let sources: Array<{ title: string; url: string; snippet: string }> = [];

  // Try Tavily first
  if (providerKeys.tavily) {
    try {
      const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${providerKeys.tavily}`,
        },
        body: JSON.stringify({
          query,
          search_depth: "advanced",
          include_answer: true,
          max_results: 8,
        }),
      });

      if (res.ok) {
        const data = await res.json() as {
          results?: Array<{ title?: string; url?: string; content?: string }>;
          answer?: string;
        };
        sources = (data.results ?? []).map((r, i) => ({
          title: r.title ?? `Source ${i + 1}`,
          url: r.url ?? "",
          snippet: r.content ?? "",
        }));
        context = (data.results ?? [])
          .map((r, i) => `[${i + 1}] ${r.title}: ${r.content}`)
          .join("\n\n");
      }
    } catch (e) {
      console.error("Tavily search error:", e);
    }
  }

  // Try Serper as fallback
  if (!sources.length && providerKeys.serper) {
    try {
      const res = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "X-API-KEY": providerKeys.serper,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ q: query, num: 8 }),
      });

      if (res.ok) {
        const data = await res.json() as {
          organic?: Array<{ title?: string; link?: string; snippet?: string }>;
        };
        sources = (data.organic ?? []).map((r, i) => ({
          title: r.title ?? `Source ${i + 1}`,
          url: r.link ?? "",
          snippet: r.snippet ?? "",
        }));
        context = (data.organic ?? [])
          .map((r, i) => `[${i + 1}] ${r.title}: ${r.snippet}`)
          .join("\n\n");
      }
    } catch (e) {
      console.error("Serper search error:", e);
    }
  }

  // Map provider keys to council models
  const councilKeys: Record<ProviderName, string | undefined> = {
    gemini: providerKeys.gemini,
    groq: providerKeys.groq,
    mistral: providerKeys.mistral,
    qwen_qwq_32b: providerKeys.openrouter,
    qwen_coder_32b: providerKeys.openrouter,
    deepseek_r1_distill_32b: providerKeys.openrouter,
    deepseek_chat: providerKeys.openrouter,
    minimax_text_01: providerKeys.openrouter,
    llama_3_3_70b: providerKeys.openrouter,
    llama_3_1_8b: providerKeys.openrouter,
    mistral_7b: providerKeys.openrouter,
    liquid_lfm_2_24b: providerKeys.openrouter,
    gemma_3_27b: providerKeys.openrouter,
    gemma_2_27b: providerKeys.openrouter,
    gemma_2_9b: providerKeys.openrouter,
    bytedance_seedance: providerKeys.openrouter,
    yi_coder_34b: providerKeys.openrouter,
    yi_chat_34b: providerKeys.openrouter,
    command_r_plus: providerKeys.openrouter,
    command_r: providerKeys.openrouter,
    stable_chat: providerKeys.openrouter,
    nvidia_nemotron_8b: providerKeys.openrouter,
    claude_3_haiku: providerKeys.openrouter,
    gpt_4o_mini: providerKeys.openrouter,
    hermes_3_llama_8b: providerKeys.openrouter,
    qdrant_rerank: providerKeys.openrouter,
    flashcards: providerKeys.openrouter,
  } as Record<ProviderName, string | undefined>;

  // Run council debate with all available models
  const debate = await councilDebate(query, context, councilKeys);
  
  // Synthesize with best available model (with fallback chain)
  const synthesis = await synthesizeWithGemma(
    query,
    debate,
    context,
    providerKeys.gemini,
    providerKeys.openrouter
  );

  return c.json({
    synthesis,
    sources,
    debate: debate.map((d) => ({
      provider: d.provider,
      success: d.success,
      error: d.error,
    })),
  });
});

app.get("/", serveStatic({ path: "./public/index.html" }));
app.get("*", serveStatic({ root: "./public" }));

export default {
  port: Bun.env.PORT ?? 3000,
  fetch: app.fetch,
};