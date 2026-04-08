// Browser-based Local Inference using Transformers.js + WebGPU
// This runs LLMs directly in the browser - ZERO COST

const PIPELINE_URL = 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';

let generator = null;
let isModelLoading = false;

export async function checkWebGPUSupport() {
  if (!navigator.gpu) return false;
  try {
    const adapter = await navigator.gpu.requestAdapter();
    return !!adapter;
  } catch {
    return false;
  }
}

export async function loadLocalModel() {
  if (generator || isModelLoading) return !!generator;
  
  isModelLoading = true;
  console.log('Loading local model in browser via WebGPU...');
  
  try {
    // Dynamically import transformers.js
    const { pipeline, env } = await import(PIPELINE_URL);
    
    // Configure for WebGPU
    env.allowLocalModels = false;
    env.useBrowserCache = true;
    
    // Use a small, fast model suitable for browser
    // Phi-1.5 is a good lightweight option (~1B params, 4-bit quantized)
    generator = await pipeline('text-generation', 'Xenova/phi-1.5', {
      device: 'webgpu',
      dtype: 'q4',
    });
    
    console.log('Local model ready!');
    isModelLoading = false;
    return true;
  } catch (error) {
    console.error('Failed to load local model:', error);
    isModelLoading = false;
    return false;
  }
}

export async function generateLocal(prompt, options = {}) {
  if (!generator) {
    const loaded = await loadLocalModel();
    if (!loaded) throw new Error('Local model not available');
  }
  
  const maxTokens = options.maxTokens || 512;
  const temperature = options.temperature || 0.3;
  
  try {
    const output = await generator(prompt, {
      max_new_tokens: maxTokens,
      temperature,
      do_sample: temperature > 0,
    });
    
    return output[0].generated_text;
  } catch (error) {
    console.error('Local generation error:', error);
    throw error;
  }
}

export function getModelInfo() {
  return {
    name: 'Phi-1.5 (Local)',
    contextLength: 2048,
    supportsVision: false,
    type: 'local-webgpu',
    description: 'Lightweight model running in browser via WebGPU'
  };
}

// Check Chrome built-in AI (Gemini Nano)
export async function checkBuiltInAI() {
  // @ts-ignore - experimental Chrome API
  if (window.ai && window.ai.canCreateTextSession) {
    try {
      // @ts-ignore
      const canCreate = await window.ai.canCreateTextSession();
      if (canCreate === 'no') return { available: false };
      
      return {
        available: true,
        name: 'Chrome Built-in AI (Gemini Nano)',
        capabilities: ['text-generation']
      };
    } catch {
      return { available: false };
    }
  }
  return { available: false };
}

// Initialize and expose global functions
export async function initLocalAI() {
  const webgpu = await checkWebGPUSupport();
  const builtIn = await checkBuiltInAI();
  
  return {
    webGPU: webgpu,
    builtInAI: builtIn,
    ready: webgpu || builtIn.available
  };
}