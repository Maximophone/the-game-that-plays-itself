# The Game That Plays Itself

> A 2D sandbox simulation where LLM-driven agents gather, build, survive, and interact — with no explicit goals, just emergent behavior.

## Overview

This is an experiment in AI behavior: drop a few LLM-powered agents into a minimal Minecraft-like world and watch what happens. No goals, no win conditions — just survival, building, and social dynamics.

**See [idea.md](./idea.md) for the full concept and architecture.**

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Visualization │◄────│     Server      │────►│   AI Players    │
│   (React Web)   │     │  (Game Loop)    │     │ (Gemini Flash)  │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │     Engine      │
                        │  (Pure Logic)   │
                        └─────────────────┘
```

## Project Structure

```
src/
├── shared/         # Shared types (the contract)
├── engine/         # Pure game logic
├── server/         # Game orchestration
├── ai-players/     # LLM integration
└── web/            # Visualization
```

## Development

Each component has its own devlog for tracking progress:
- [docs/devlog-engine.md](./docs/devlog-engine.md)
- [docs/devlog-server.md](./docs/devlog-server.md)
- [docs/devlog-ai-players.md](./docs/devlog-ai-players.md)
- [docs/devlog-web.md](./docs/devlog-web.md)

## Getting Started

### 1. Install Dependencies

```bash
npm install
cd src/web && npm install && cd ../..
```

### 2. Configure Environment

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Then edit `.env` and add your Gemini API key:

```bash
# Get your API key from: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_actual_api_key_here
```

**Note**: If you don't set `GEMINI_API_KEY`, the game will automatically use a dummy AI that makes random moves (useful for testing visuals).

### 3. Run the Game

```bash
# Terminal 1: Start the server (port 3001)
npm run dev

# Terminal 2: Start the web visualization (port 5174)
cd src/web && npm run dev
```

Then open http://localhost:5174 in your browser to watch the agents!

### 4. Build for Production

```bash
npm run build
```

## License

MIT
