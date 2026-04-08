// Cloudflare Workers - Sovereign Council
// Deploy with: npx wrangler deploy

// @ts-ignore - Cloudflare Workers compatible imports
import { Hono } from "https://esm.sh/hono@4.12.12";
// @ts-ignore
import { cors } from "https://esm.sh/hono@4.12.12/middleware";

type Env = {
  KEYS: KVNamespace;
  GEMINI_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  TAVILY_API_KEY?: string;
  GROQ_API_KEY?: string;
};

const app = new Hono<{ Bindings: Env }>();

app.use("/*", cors());

function getKey(env: Env, provider: string): string | undefined {
  const key = provider.toUpperCase() + "_API_KEY";
  return (env as any)[key] || env.KEYS?.get(provider);
}

// HTML Frontend
app.get("/", (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sovereign Council</title>
  <script src="https://unpkg.com/htmx.org@2.0.4"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    body { font-family: 'Inter', sans-serif; }
    .prose pre { background: #1e1e2e; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; }
    .prose code { background: #2a2a3a; padding: 0.125rem 0.375rem; border-radius: 0.25rem; }
  </style>
</head>
<body class="bg-[#0f0f14] text-gray-100 min-h-screen">
  <div class="max-w-3xl mx-auto p-6">
    <h1 class="text-xl font-semibold text-white flex items-center gap-2">
      <span class="text-blue-400">◆</span> Sovereign Council
    </h1>
    <p class="text-xs text-gray-500 mt-1 mb-6">Cloudflare Workers - Multi-LLM Search</p>
    
    <div id="chat-area" class="space-y-4 mb-6">
      <div id="welcome" class="text-center py-12">
        <h2 class="text-2xl font-light text-white mb-2">What do you want to know?</h2>
        <p class="text-gray-500">The Council searches, debates, and synthesizes.</p>
      </div>
    </div>
    
    <form id="search-form" class="flex gap-2">
      <input type="text" name="query" id="query-input" placeholder="Ask the Council..." 
        class="flex-1 bg-[#1e1e2e] border border-[#2a2a3a] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
      <button type="submit" class="px-6 py-3 bg-blue-600 rounded-xl text-white hover:bg-blue-500">Ask</button>
    </form>
    
    <div class="mt-6 p-4 bg-[#1e1e2e] rounded-lg">
      <h3 class="text-xs font-medium text-gray-400 mb-2">Available Models</h3>
      <p class="text-xs text-gray-500">Gemini 4, Gemma 3, Liquid LFM 2.5, Qwen, DeepSeek, Llama</p>
    </div>
  </div>
  
  <script>
    const chatArea = document.getElementById('chat-area');
    const queryInput = document.getElementById('query-input');
    const welcome = document.getElementById('welcome');
    
    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
    
    function addMessage(role, content) {
      const div = document.createElement('div');
      div.className = role === 'user' ? 'text-right' : '';
      div.innerHTML = role === 'user' 
        ? '<div class="inline-block bg-[#1e1e2e] rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-white">' + escapeHtml(content) + '</div>'
        : '<div class="prose prose-invert text-sm">' + content + '</div>';
      chatArea.appendChild(div);
      chatArea.scrollTop = chatArea.scrollHeight;
    }
    
    function addLoading() {
      const div = document.createElement('div');
      div.id = 'loading';
      div.innerHTML = '<div class="text-gray-400"><div class="flex items-center gap-2"><div class="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div><span>Consulting the Council...</span></div></div>';
      chatArea.appendChild(div);
      chatArea.scrollTop = chatArea.scrollHeight;
    }
    
    document.getElementById('search-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const query = queryInput.value.trim();
      if (!query) return;
      if (welcome) welcome.style.display = 'none';
      addMessage('user', query);
      addLoading();
      queryInput.value = '';
      
      try {
        const res = await fetch('/api/council', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({query})
        });
        const data = await res.json();
        document.getElementById('loading')?.remove();
        
        if (data.error) {
          addMessage('assistant', '<span class="text-red-400">Error: ' + escapeHtml(data.error) + '</span>');
          return;
        }
        
        const rendered = marked.parse(data.synthesis || 'No response');
        addMessage('assistant', rendered);
      } catch (err) {
        document.getElementById('loading')?.remove();
        addMessage('assistant', '<span class="text-red-400">Request failed</span>');
      }
    });
  </script>
</body>
</html>`);
});

// API: Search & Synthesis
app.post("/api/council", async (c) => {
  const { query } = await c.req.json();
  if (!query) return c.json({ error: "Query required" }, 400);

  const env = c.env;
  
  // Get keys from env vars
  const keys = {
    gemini: env.GEMINI_API_KEY,
    openrouter: env.OPENROUTER_API_KEY,
    tavily: env.TAVILY_API_KEY,
  };

  // Search with Tavily
  let sources: Array<{title: string; url: string; snippet: string}> = [];
  let context = "";

  if (keys.tavily) {
    try {
      const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${keys.tavily}`,
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

  // Synthesize with AI
  let synthesis = "";
  const debate: Array<{provider: string; success: boolean; error?: string}> = [];

  const modelKey = keys.gemini || keys.openrouter;
  if (modelKey) {
    try {
      const isGemini = !!keys.gemini;
      const modelUrl = isGemini 
        ? "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
        : "https://openrouter.ai/api/v1/chat/completions";
      const model = isGemini ? "gemini-2.5-flash-preview-04-17" : "google/gemma-3-4b-it:free";
      
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${modelKey}`,
      };
      if (!isGemini) {
        headers["HTTP-Referer"] = "https://sovereign-council.workers.dev";
        headers["X-Title"] = "Sovereign Council";
      }

      const res = await fetch(modelUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: "You are the Sovereign Council. Provide a comprehensive answer with citations [1], [2]. Be objective and precise." },
            { role: "user", content: `Query: ${query}\n\nSearch Results:\n${context}` }
          ],
          temperature: 0.3,
          max_tokens: 4096,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        synthesis = data.choices?.[0]?.message?.content || "";
        debate.push({ provider: model, success: true });
      } else {
        debate.push({ provider: model, success: false, error: `Status ${res.status}` });
      }
    } catch (e: any) {
      debate.push({ provider: "api", success: false, error: e.message });
    }
  }

  // Fallback
  if (!synthesis) {
    synthesis = `## Search Results\n\n${context}\n\nConfigure GEMINI_API_KEY or OPENROUTER_API_KEY environment variable to get AI synthesis.`;
  }

  return c.json({ synthesis, sources, debate });
});

export default app;