# AI Players Devlog

Development log for the **AI Players** component — LLM integration for agent decision-making.

**Owner**: TBD  
**Status**: Not Started

---

## Responsibilities

- Format prompts from `AgentView` data
- Call Gemini 3 Flash API
- Parse LLM responses into structured `Action` objects
- Handle malformed responses (retry logic)
- Manage API rate limits and errors

## Dependencies

- `src/shared/types.ts`
- Gemini API SDK (`@google/generative-ai` or similar)

## Log

### 2026-01-17 — Project Created
- Initial project setup
- Architecture defined in idea.md

---

*Add entries above this line as you work on the component.*
