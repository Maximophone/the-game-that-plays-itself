# Devlog: AI Players Component

## 2026-01-17: Gemini Integration

Implemented the AI player component using Gemini 3.0 Flash (`gemini-3.0-flash`).

### Features
- **Gemini Client**: Wrapper around `@google/generative-ai` to handle model interaction.
- **Prompt Formatting**: Converts `AgentView` into a dense, text-based representation for the LLM. Includes:
    - Status (Position, Hunger, Inventory)
    - Grid View (centered on agent)
    - Heard Messages
    - Available Actions list
- **Response Parsing**: Extracts structured `Action` objects from LLM text responses. Supports:
    - `move`, `wait`, `gather`, `build`, `speak`, `hit`, `eat`, `think`.
- **Main Controller**: Orchestrates the flow, handles basic parsing retries, and defaults to `wait` on failure.

### Testing
- Created unit tests in `src/ai-players/ai-players.test.ts` covering formatting and parsing.
- Verified parsing logic for various action formats.

### Environment
- Requires `GEMINI_API_KEY` to be set in the environment.
