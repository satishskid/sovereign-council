// Deno Deploy KV store (free!)
const kv = await Deno.openKv();

const PROVIDER_KEYS = new Map<string, string>();

function getKey(provider: string): string | undefined {
  return PROVIDER_KEYS.get(provider) || Deno.env.get(`${provider.toUpperCase()}_API_KEY`);
}

function setKey(provider: string, key: string) {
  PROVIDER_KEYS.set(provider, key);
  // Also persist to KV
  kv.set(["key", provider], key);
}

async function loadKeys() {
  const iter = kv.list({ prefix: ["key"] });
  for await (const entry of iter) {
    const provider = entry.key[1] as string;
    const key = entry.value as string;
    PROVIDER_KEYS.set(provider, key);
  }
}

// Hono imports for Deno
import { Hono } from "https://deno.land/x/hono/mod.ts";
import { cors } from "https://deno.land/x/hono/middleware.ts";
import { 
  councilDebate, 
  synthesizeWithGemma, 
  type ProviderName,
  getAllProviders 
} from "./lib/council.ts";
import search from "./lib/search.ts";

const app = new Hono();

app.use("/*", cors());

// Serve static HTML
app.get("/", async (c) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sovereign Council</title>
  <script src="https://unpkg.com/htmx.org@2.0.4"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: Inter, system-ui; }
    .prose pre { background: #1e1e2e; padding: 1rem; border-radius: 0.5rem; }
  </style>
</head>
<body class="bg-[#0f0f14] text-gray-100 min-h-screen">
  <div class="max-w-3xl mx-auto p-6">
    <h1 class="text-2xl font-semibold mb-4">◆ Sovereign Council</h1>
    <p class="text-gray-500 mb-6">Multi-LLM Search Aggregator - Running on Deno Deploy</p>
    
    <form id="search-form" class="flex gap-2 mb-6">
      <input type="text" name="query" id="query-input" placeholder="Ask the Council..."
        class="flex-1 bg-[#1e1e2e] border border-[#2a2a3a] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
      <button type="submit" class="px-6 py-3 bg-blue-600 rounded-lg text-white hover:bg-blue-500">Ask</button>
    </form>
    
    <div id="response-area" class="space-y-4"></div>
    
    <div class="mt-8 p-4 bg-[#1e1e2e] rounded-lg">
      <h2 class="text-sm font-medium text-gray-400 mb-2">API Keys (set as env vars)</h2>
      <p class="text-xs text-gray-500">GEMINI_API_KEY, OPENROUTER_API_KEY, TAVILY_API_KEY</p>
    </div>
  </div>
  
  <script>
    document.getElementById('search-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const query = document.getElementById('query-input').value;
      const response = await fetch('/api/council', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({query})
      });
      const data = await response.json();
      document.getElementById('response-area').innerHTML = 
        '<div class="prose prose-invert"><pre>' + JSON.stringify(data, null, 2) + '</pre></div>';
    });
  </script>
</body>
</html>`;
  return c.html(html);
});

app.get("/api/models", (c) => {
  return c.json(getAllProviders());
});

app.post("/api/keys", async (c) => {
  const { provider, apiKey } = await c.req.json();
  setKey(provider, apiKey);
  return c.json({ success: true });
});

app.post("/api/council", async (c) => {
  const { query } = await c.req.json();
  if (!query) return c.json({ error: "Query required" }, 400);

  const providerKeys = {
    gemini: getKey("gemini"),
    openrouter: getKey("openrouter"),
    tavily: getKey("tavily"),
  };

  let context = "";
  let sources: Array<{title: string; url: string; snippet: string}> = [];

  // Search
  if (providerKeys.tavily) {
    try {
      const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${providerKeys.tavily}`,
        },
        body: JSON.stringify({ query, max_results: 5 }),
      });
      if (res.ok) {
        const data = await res.json();
        sources = (data.results ?? []).map((r: any, i: number) => ({
          title: r.title ?? `Source ${i + 1}`,
          url: r.url ?? "",
          snippet: r.content ?? "",
        }));
        context = sources.map((s, i) => `[${i + 1}] ${s.title}: ${s.snippet}`).join("\n\n");
      }
    } catch (e) {}
  }

  // Council keys
  const councilKeys = {
    gemini: providerKeys.gemini,
    gemma_3_4b: providerKeys.openrouter,
    liquid_lfm_2_5_1b_thinking: providerKeys.openrouter,
    qwen_qwq_32b: providerKeys.openrouter,
    deepseek_r1_distill_32b: providerKeys.openrouter,
  } as Record<ProviderName, string | undefined>;

  const debate = await councilDebate(query, context, councilKeys);
  const synthesis = await synthesizeWithGemma(
    query, debate, context,
    providerKeys.gemini,
    providerKeys.openrouter
  );

  return c.json({ synthesis, sources, debate: debate.map(d => ({
    provider: d.provider, success: d.success, error: d.error
  }))});
});

app.route("/api/search", search);

export default app;
export type { DenoRuntime } from "https://deno.land/x/hono/types.ts";