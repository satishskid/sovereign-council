// WebLLM - High-performance In-Browser LLM Inference
// Perfect complement: Zero cost + Privacy + Offline
// npm: @mlc-ai/web-llm

export interface WebLLMConfig {
  model: string;
  device: 'webgpu' | 'webgl';
  dtype: 'q4f16_1' | 'q4f32_1' | 'q4f16_2';
}

export const RECOMMENDED_MODELS: WebLLMConfig[] = [
  // Smallest - fastest, works on most GPUs
  { model: 'Llama-3.1-1B-Instruct-q4f16_1-MLC', device: 'webgpu', dtype: 'q4f16_1' },
  // Good balance of speed/quality
  { model: 'Phi-3.5-mini-instruct-q4f16_1-MLC', device: 'webgpu', dtype: 'q4f16_1' },
  // Best quality (needs more VRAM)
  { model: 'Qwen2-1.5B-Instruct-q4f16_1-MLC', device: 'webgpu', dtype: 'q4f16_1' },
  // Liquid LFM (if supported)
  { model: 'LFM-2.5-1B-Artifact-q4f16_1-MLC', device: 'webgpu', dtype: 'q4f16_1' },
];

export class LocalLLM {
  private engine: any = null;
  private model: string;
  private device: 'webgpu' | 'webgl';
  private dtype: string;
  
  constructor(config: WebLLMConfig) {
    this.model = config.model;
    this.device = config.device;
    this.dtype = config.dtype;
  }

  async initialize(): Promise<boolean> {
    if (this.engine) return true;
    
    try {
      // Dynamic import - works in browser
      const mlc = await import('@mlc-ai/web-llm');
      
      this.engine = await mlc.CreateMLCEngine(
        this.model,
        {
          deviceType: this.device,
          dtype: this.dtype,
          // Progress callback
          initProgressCallback: (progress: number, message: string) => {
            console.log(`Loading: ${Math.round(progress * 100)}% - ${message}`);
          }
        }
      );
      
      console.log('✅ Local LLM ready!');
      return true;
    } catch (error) {
      console.error('Failed to initialize local LLM:', error);
      return false;
    }
  }

  async chat(messages: Array<{role: string; content: string}>): Promise<string> {
    if (!this.engine) {
      await this.initialize();
    }
    
    const response = await this.engine.chat.completions.create({
      messages,
      temperature: 0.3,
      max_tokens: 4096,
    });
    
    return response.choices[0]?.message?.content || '';
  }

  async *streamChat(messages: Array<{role: string; content: string}>) {
    if (!this.engine) {
      await this.initialize();
    }
    
    const stream = await this.engine.chat.completions.create({
      messages,
      temperature: 0.3,
      max_tokens: 4096,
      stream: true,
    });
    
    for await (const chunk of stream) {
      yield chunk.choices[0]?.delta?.content || '';
    }
  }

  destroy() {
    if (this.engine) {
      this.engine = null;
    }
  }
}

// Check WebGPU availability
export async function checkWebGPU(): Promise<{available: boolean; device: string}> {
  if (!navigator.gpu) {
    return { available: false, device: 'none' };
  }
  
  try {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      return { available: false, device: 'none' };
    }
    
    const info = adapter.info;
    return { 
      available: true, 
      device: info.vendor || info.architecture || 'unknown GPU'
    };
  } catch {
    return { available: false, device: 'none' };
  }
}

// Get recommended model based on device
export function getRecommendedModel(gpuInfo: string): WebLLMConfig {
  const lower = gpuInfo.toLowerCase();
  
  // NVIDIA GPUs can handle larger models
  if (lower.includes('nvidia')) {
    return { model: 'Qwen2-1.5B-Instruct-q4f16_1-MLC', device: 'webgpu', dtype: 'q4f16_1' };
  }
  
  // Apple Silicon works well with these
  if (lower.includes('apple') || lower.includes('m1') || lower.includes('m2') || lower.includes('m3')) {
    return { model: 'Llama-3.1-1B-Instruct-q4f16_1-MLC', device: 'webgpu', dtype: 'q4f16_1' };
  }
  
  // Default fallback
  return { model: 'Phi-3.5-mini-instruct-q4f16_1-MLC', device: 'webgpu', dtype: 'q4f16_1' };
}

// Integration with Sovereign Council
export async function createLocalCouncil(query: string, searchContext: string): Promise<string> {
  const { available, device } = await checkWebGPU();
  
  if (!available) {
    return 'WebGPU not available. Use cloud API instead.';
  }
  
  const model = getRecommendedModel(device);
  const llm = new LocalLLM(model);
  
  const initialized = await llm.initialize();
  if (!initialized) {
    return 'Failed to load local model.';
  }
  
  const response = await llm.chat([
    { role: 'system', content: 'You are the Sovereign Council. Provide a comprehensive answer with citations [1], [2] based on search results. Be objective and precise.' },
    { role: 'user', content: `Query: ${query}\n\nSearch Results:\n${searchContext}` }
  ]);
  
  llm.destroy();
  return response;
}