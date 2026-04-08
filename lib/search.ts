import { Hono } from "hono";
import { stream } from "hono/streaming";

const app = new Hono();

app.post("/", async (c) => {
  const { query } = await c.req.json();

  if (!query || typeof query !== "string") {
    return c.json({ error: "Query is required" }, 400);
  }

  const tavilyKey = Bun.env.TAVILY_API_KEY;
  if (!tavilyKey) {
    return c.json({ error: "Tavily API key not configured" }, 500);
  }

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tavilyKey}`,
    },
    body: JSON.stringify({
      query,
      search_depth: "advanced",
      include_answer: true,
      include_raw_content: true,
      max_results: 5,
    }),
  });

  if (!res.ok) {
    return c.json({ error: "Tavily search failed" }, 502);
  }

  const data = await res.json();
  return c.json(data);
});

app.post("/stream", async (c) => {
  const { query, context, debate } = await c.req.json();

  return stream(c, async (stream) => {
    const geminiKey = Bun.env.GEMINI_API_KEY;
    const openrouterKey = Bun.env.OPENROUTER_API_KEY;

    const synthesisKey = geminiKey || openrouterKey;
    const model = geminiKey
      ? "gemini-2.5-flash-preview-04-17"
      : "liquid/lfm-40b";

    const url = geminiKey
      ? "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
      : "https://openrouter.ai/api/v1/chat/completions";

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${synthesisKey}`,
    };

    if (!geminiKey) {
      headers["HTTP-Referer"] = "https://sovereign-council.local";
      headers["X-Title"] = "Sovereign Council";
    }

    const messages = [
      {
        role: "system",
        content: `You are the SovereIGN Council synthesizer. Provide a comprehensive, well-cited answer based on the search context and council debate results. Use inline citations [1], [2], [3] referencing sources. Format in clean markdown.`,
      },
      { role: "user", content: `Query: ${query}\n\nContext:\n${context}` },
    ];

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.2,
        max_tokens: 4096,
        stream: true,
      }),
    });

    if (!res.ok) {
      await stream.write(new TextEncoder().encode(`Error: ${res.status}`));
      return;
    }

    const reader = res.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content ?? "";
            if (content) {
              await stream.write(new TextEncoder().encode(content));
            }
          } catch {}
        }
      }
    }
  });
});

export default app;
