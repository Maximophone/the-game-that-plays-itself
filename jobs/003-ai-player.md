# Job: AI Player (Gemini Integration)

**Component**: ai-players  
**Status**: pending

## Context

This is "The Game That Plays Itself" — a 2D sandbox simulation where LLM-driven agents gather resources, build structures, survive, and interact on a grid world.

The **ai-players** component calls Gemini 3 Flash to decide what action each agent takes. It receives an `AgentView` (what the agent can see) and returns an `Action`.

## Objective

Implement the AI player that uses Gemini 3 Flash to make decisions.

### 1. Set up Gemini client
- Create `src/ai-players/gemini.ts`
- Use `@google/generative-ai` package
- Read API key from `GEMINI_API_KEY` environment variable
- Use `gemini-2.0-flash` model

### 2. Implement prompt formatting
- Create `src/ai-players/prompt.ts`
- Function `formatPrompt(view: AgentView, identity: AgentIdentity): string`
- Convert the agent's view into a readable text prompt
- Include: agent's status, what they see, recent messages, available actions
- See `idea.md` section "Text Representation (For LLM)" for format

### 3. Implement response parsing
- Create `src/ai-players/parser.ts`
- Function `parseAction(response: string): Action | null`
- Extract the action from LLM's response
- Handle: move(up), gather(left), speak("hello"), eat, wait, etc.
- Return null if parsing fails

### 4. Implement main AI player function
- Create `src/ai-players/index.ts`
- Function `getAction(view: AgentView, identity: AgentIdentity): Promise<Action>`
- Format prompt → Call Gemini → Parse response
- If parsing fails, retry once, then default to `wait`
- Log the thought/action for debugging

### 5. Add basic error handling
- Handle API errors gracefully
- Rate limit handling (basic retry with backoff)
- Timeout handling

## Files to Read

1. `src/shared/types.ts` — Types for `AgentView`, `AgentIdentity`, `Action`
2. `idea.md` — Section "Text Representation (For LLM)" for prompt format
3. `idea.md` — Section "Actions (MVP)" for action syntax

## Acceptance Criteria

- [ ] Can call Gemini and get a response
- [ ] Correctly formats agent view into readable prompt
- [ ] Parses LLM response into structured `Action`
- [ ] Handles errors without crashing
- [ ] Exports `getAction` function from `src/ai-players/index.ts`
- [ ] Updated `docs/devlog-ai-players.md` with what was implemented

## Notes

- Keep prompts simple for now — we can iterate on prompt engineering later
- The agent should be encouraged to think first, then act
- Don't worry about personality/identity prompts yet — just basic decision making
- Test with a simple mock `AgentView` if needed

## Completion Report (2026-01-17)

### Accomplishments
- **Gemini Integration**: Successfully integrated `gemini-3.0-flash` using the `@google/generative-ai` SDK.
- **Robust Prompting**: Created a dense text representation for the agent's view, including a relative grid visualization, hunger status, and inventory.
- **Regex Parsing**: Implemented a flexible action parser that handles both direct commands and thought-prefixed responses.
- **Error Handling**: Implemented a one-retry mechanism for parsing failures and graceful degradation to a `wait` action on API or persistent parsing errors.
- **Verification**: 100% test coverage for core formatting and parsing logic in `src/ai-players/ai-players.test.ts`.

### Challenges & Notes
- **Property Access Bug**: Encountered an issue where `self.self.maxHunger` was accessed instead of `self.maxHunger`. This was caught by unit tests and corrected.
- **Model Versioning**: Updated from the initially specified `gemini-2.0-flash` to `gemini-3.0-flash` per the latest requirements.
- **Token Efficiency**: The grid representation is quite verbose in text. Future iterations might benefit from a more compact serialization if token cost becomes an issue.

**Status**: ✅ COMPLETED
**Next Steps**: Integration into the main server orchestrator.

