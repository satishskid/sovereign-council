// Ollama Local LLM Connector
// Connects to Ollama running on localhost
// Run: ollama serve (defaults to localhost:11434)

export interface OllamaConfig {
  baseUrl?: string;
  defaultModel?: string;
}

export interface OllamaModel {
  name: string;
  size: number;
  modified_at: string;
}

const DEFAULT_CONFIG: OllamaConfig = {
  baseUrl: 'http://localhost:11434',
  defaultModel: 'phi3',
};

export class OllamaClient {
  private baseUrl: string;
  private defaultModel: string;

  constructor(config: OllamaConfig = DEFAULT_CONFIG) {
    this.baseUrl = config.baseUrl || DEFAULT_CONFIG.baseUrl;
    this.defaultModel = config.defaultModel || DEFAULT_CONFIG.defaultModel;
  }

  async checkConnection(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(3000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async listModels(): Promise<OllamaModel[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.models || [];
    } catch {
      return [];
    }
  }

  async generate(
    prompt: string,
    options: {
      model?: string;
      temperature?: number;
      stream?: boolean;
      system?: string;
    } = {}
  ): Promise<string> {
    const model = options.model || this.defaultModel;
    
    const res = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        temperature: options.temperature || 0.3,
        stream: options.stream || false,
        system: options.system || 'You are the Sovereign Council. Provide a comprehensive answer with citations. Be concise.',
      }),
    });

    if (!res.ok) {
      throw new Error(`Ollama error: ${res.status}`);
    }

    const data = await res.json();
    return data.response;
  }

  async *streamGenerate(
    prompt: string,
    options: {
      model?: string;
      temperature?: number;
      system?: string;
    } = {}
  ): AsyncGenerator<string> {
    const model = options.model || this.defaultModel;
    
    const res = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        temperature: options.temperature || 0.3,
        stream: true,
        system: options.system || 'You are the Sovereign Council. Provide a comprehensive answer with citations.',
      }),
    });

    if (!res.ok) {
      throw new Error(`Ollama error: ${res.status}`);
    }

    const reader = res.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          try {
            const data = JSON.parse(line);
            if (data.response) {
              yield data.response;
            }
          } catch {}
        }
      }
    }
  }

  async chat(
    messages: Array<{ role: string; content: string }>,
    options: {
      model?: string;
      temperature?: number;
    } = {}
  ): Promise<string> {
    const model = options.model || this.defaultModel;
    
    // Convert messages to Ollama format
    const prompt = messages
      .map(m => `${m.role === 'system' ? '' : '\n'}${m.role}: ${m.content}`)
      .join('') + '\nassistant: ';

    return this.generate(prompt, { model, temperature: options.temperature });
  }
}

// Check if Ollama is running
export async function isOllamaRunning(): Promise<boolean> {
  const client = new OllamaClient();
  return client.checkConnection();
}

// Get available models
export async function getOllamaModels(): Promise<OllamaModel[]> {
  const client = new OllamaClient();
  return client.listModels();
}

// Generate with Ollama
export async function ollamaGenerate(
  prompt: string,
  model?: string
): Promise<string> {
  const client = new OllamaClient();
  return client.generate(prompt, { model });
}

// Stream generate with Ollama
export async function*ollamaStreamGenerate(
  prompt: string,
  model?: string
): AsyncGenerator<string> {
  const client = new OllamaClient();
  yield* client.streamGenerate(prompt, { model });
}

// Integrate with Sovereign Council
export async function ollamaCouncil(
  query: string,
  searchContext: string,
  model?: string
): Promise<string> {
  const prompt = `You are the Sovereign Council. Using the search results below, provide a comprehensive answer with citations [1], [2]. Be objective and precise.

Query: ${query}

Search Results:
${searchContext}

Answer:`;

  return ollamaGenerate(prompt, model);
}