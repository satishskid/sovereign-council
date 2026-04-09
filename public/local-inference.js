// WebLLM Integration for Sovereign Council
// Zero-cost local inference via WebGPU - NO API CALLS!

let webLLMEngine = null;
let isLoading = false;

const MODELS = {
  // Liquid AI LFM 2.5 - Latest! (Smallest, fastest)
  lfm_350m: 'LFM-2.5-350M-q4f16_1-MLC',
  lfm_1b: 'LFM-2.5-1B-q4f16_1-MLC',
  // Phi - Fast, good reasoning
  phi: 'Phi-3.5-mini-instruct-q4f16_1-MLC',
  // Llama - Good quality
  llama: 'Llama-3.1-1B-Instruct-q4f16_1-MLC',
  // Qwen - Best quality (needs more VRAM)
  qwen: 'Qwen2-1.5B-Instruct-q4f16_1-MLC',
};

async function checkWebGPU() {
  if (!navigator.gpu) return { available: false, device: 'none' };
  try {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) return { available: false, device: 'none' };
    return { available: true, device: adapter.info?.vendor || 'GPU' };
  } catch { return { available: false, device: 'none' }; }
}

async function loadModel(modelName = 'phi') {
  if (webLLMEngine || isLoading) return !!webLLMEngine;
  
  isLoading = true;
  console.log('Loading ' + modelName + ' locally...');
  
  try {
    const model = MODELS[modelName] || MODELS.phi;
    webLLMEngine = await window.webllm.CreateMLCEngine(model, {
      deviceType: 'webgpu',
      dtype: 'q4f16_1',
      initProgressCallback: (progress, message) => {
        console.log(`Loading: ${Math.round(progress * 100)}% - ${message}`);
        updateLoadingStatus(progress, message);
      }
    });
    console.log('✅ WebLLM ready!');
    isLoading = false;
    return true;
  } catch (error) {
    console.error('Failed to load model:', error);
    isLoading = false;
    return false;
  }
}

function updateLoadingStatus(progress, message) {
  const statusEl = document.getElementById('browser-status');
  if (statusEl) {
    statusEl.textContent = Math.round(progress * 100) + '%';
  }
}

async function generateLocal(prompt, options = {}) {
  if (!webLLMEngine) {
    await loadModel();
  }
  
  if (!webLLMEngine) throw new Error('Local model not available');
  
  try {
    const response = await webLLMEngine.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are the Sovereign Council. Provide a comprehensive answer with citations [1], [2]. Be concise and accurate.' },
        { role: 'user', content: prompt }
      ],
      temperature: options.temperature || 0.3,
      max_tokens: options.maxTokens || 2048,
    });
    
    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Local generation error:', error);
    throw error;
  }
}

function getModelInfo() {
  return {
    name: 'WebLLM (Local)',
    contextLength: 4096,
    supportsVision: false,
    type: 'local-webgpu',
    description: 'Runs in your browser - zero cost!'
  };
}

async function initLocalAI() {
  const { available, device } = await checkWebGPU();
  const statusEl = document.getElementById('browser-status');
  const localModelEl = document.getElementById('local-model');
  
  if (available && statusEl) {
    statusEl.textContent = 'Ready';
    statusEl.className = 'model-badge bg-purple-500/20 text-purple-400';
    if (localModelEl) localModelEl.style.opacity = '1';
    console.log('WebGPU available - ' + device);
  }
}

initLocalAI();