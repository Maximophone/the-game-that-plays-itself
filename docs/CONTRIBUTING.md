# Contributing Guide (For AI Developers)

This document provides guidelines for AI developers working on this project.

## Component Ownership

Each component should be worked on by **one developer at a time** to avoid conflicts:

| Component | Devlog | Owner |
|-----------|--------|-------|
| Engine | `docs/devlog-engine.md` | TBD |
| Server | `docs/devlog-server.md` | TBD |
| AI Players | `docs/devlog-ai-players.md` | TBD |
| Web | `docs/devlog-web.md` | TBD |

## Before You Start

1. **Check `src/shared/types.ts`** — This is the contract. Understand the types before writing code.
2. **Read the component's devlog** — See what's been done, what's in progress.
3. **Update the devlog** — Add an entry when you start working on something.

## Coding Guidelines

### General
- Use TypeScript strictly (no `any` unless absolutely necessary)
- Prefer functions over classes for stateless logic
- Export types from `src/shared/types.ts`, not from component files

### Engine
- **No side effects** — Functions must be pure
- **No dependencies** — Only import from `shared/types.ts`
- Write tests for every function

### Server
- Handle errors gracefully
- Log important events
- Use environment variables for configuration

### AI Players
- Keep prompts in separate files for easy iteration
- Always validate LLM responses before using
- Implement retry logic for API failures

### Web
- Keep components small and focused
- Use hooks for state management
- Support mock data for development without server

## Devlog Format

When adding to a component's devlog:

```markdown
### YYYY-MM-DD — Brief Title

- What you did
- Any decisions made and why
- Blockers or questions
- What's next
```

## Commit Messages

Use conventional commits:
- `feat(engine): add computeNextState function`
- `fix(web): correct agent position rendering`
- `docs: update architecture diagram`
- `test(engine): add validation tests`

## Questions?

Add questions to the relevant devlog and tag them with `❓ Question:` so they're easy to find.
