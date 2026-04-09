# Sovereign Council

**Perpetual, Zero-Cost Multi-LLM Search Aggregator**

A "Bring Your Own Key" (BYOK) search engine that orchestrates multiple AI models to provide infinite, free AI-powered search with citations.

![License](https://img.shields.io/badge/license-MIT-blue)
![Cloudflare Workers](https://img.shields.io/badge/deploy-Cloudflare%20Workers-orange)
![WebGPU](https://img.shields.io/badge/inference-WebGPU-purple)

## Features

- **Multi-LLM Council Debate** - 30+ free AI models analyze your query
- **Auto-Fallback Chain** - Never go offline: Cloud → Browser → Ollama
- **Live Web Search** - Tavily/Serper for real-time grounding
- **Zero Cost** - All free tiers, unlimited usage potential
- **Privacy-First** - Local inference options available

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SOVEREIGN COUNCIL                       │
├─────────────────────────────────────────────────────────────┤
│  ☁️ Cloud API          │  🌐 Browser (WebGPU)  │ ⚡ Ollama  │
│  ─────────────────     │  ─────────────────    │ ─────────  │
│  • Gemini 4 Flash     │  • LFM 2.5 350M      │ • phi3    │
│  • Gemma 3 4B         │  • LFM 2.5 1B         │ • llama3   │
│  • Liquid LFM 2.5     │  • Phi-3.5-mini       │ • mistral │
│  • Qwen/DeepSeek/Llama │  • Llama 3.1 1B       │ • qwen    │
│                        │  • Qwen 2 1.5B        │           │
├─────────────────────────────────────────────────────────────┤
│  🔍 Search: Tavily → Serper (fallback)                     │
│  💾 Database: Turso/SQLite (Drizzle)                       │
└─────────────────────────────────────────────────────────────┘
```

## Quick Deploy (Free Forever)

### Option 1: Cloudflare Workers (Recommended)

```bash
# Clone
git clone https://github.com/satishskid/sovereign-council.git
cd sovereign-council

# Set API keys (free!)
wrangler secret put GEMINI_API_KEY
wrangler secret put OPENROUTER_API_KEY
wrangler secret put TAVILY_API_KEY

# Deploy
npx wrangler deploy
```

**Free Tier**: Unlimited requests on Cloudflare Workers!

### Option 2: Local Development

```bash
# Install
bun install

# Set keys in .env
cp .env.example .env
# Edit .env with your API keys

# Run
bun run dev
```

## Get Free API Keys

| Provider | Link | Free Tier |
|----------|------|-----------|
| **Google AI** (Gemini 4) | [aistudio.google.com](https://aistudio.google.com/app/apikey) | 1500/day |
| **OpenRouter** (30+ models) | [openrouter.ai/keys](https://openrouter.ai/keys) | 200/day |
| **Tavily** (Search) | [app.tavily.com](https://app.tavily.com/) | 1000/month |

## Inference Modes

### ☁️ Cloud API (Default)
- Uses Gemini 4 as primary, falls back to Gemma 3/Liquid LFM
- Best quality, requires API keys

### 🌐 Browser Mode (WebGPU)
- Runs LFM 2.5, Phi-3.5, Llama directly in Chrome
- **Zero cost**, zero install
- Requires WebGPU support (Chrome)

### ⚡ Ollama (Local)
- Connect to Ollama running on your machine
- Full model library (phi3, llama3, mistral, etc.)
- Works offline

```bash
# Install Ollama
curl -fsSL https://ollama.com/install | sh

# Start and pull model
ollama serve
ollama pull phi3
```

## Tech Stack

- **Runtime**: Bun
- **Backend**: Hono (Cloudflare Workers compatible)
- **Database**: Turso/SQLite (Drizzle ORM)
- **Frontend**: HTMX + Tailwind
- **Local AI**: WebLLM + Ollama

## Project Structure

```
/src           # Cloudflare Workers entry
/lib           # Council logic, Ollama connector
/public        # Frontend HTML, WebLLM
/db            # Database schema
/auth          # Better Auth (optional)
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Main UI |
| `/api/council` | POST | Search & synthesize |
| `/api/keys` | GET/POST | Manage API keys |
| `/api/search` | POST | Raw search |

## Examples

**Basic Usage:**
```
You: What is quantum computing?

Council: [Searches web] [Gemini analyzes] [Gemma checks]
[Liquid verifies] [Llama synthesizes]

Answer: Quantum computing is...
[1] Wikipedia: Quantum computing is...
[2] Nature: Quantum computers use...
```

## License

MIT - Feel free to use, modify, and distribute.

---

**Sovereign Council** - *Democratizing AI, one query at a time.* 🏛️
