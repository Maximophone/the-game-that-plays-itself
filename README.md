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

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test
```

## License

MIT
