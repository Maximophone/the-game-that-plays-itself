# Job: Persistent Agent Memory (Chat Sessions)

**Component**: ai-players  
**Status**: 🟢 done

## Context

This is "The Game That Plays Itself" — our AI-driven 2D sandbox simulation.

**Current Problem**: Each turn, agents make decisions via a **stateless** LLM call. The AI receives the current game state but has no memory of previous turns. It doesn't remember what it said, what it planned, or what happened before.

**Impact**: Agents can't form long-term strategies, maintain relationships, or learn from past actions. Every turn they start fresh, leading to incoherent behavior and lack of narrative continuity.

**Solution**: Use the Gemini Chat API to maintain a **persistent conversation** per agent. Each agent's chat history accumulates over turns, giving the LLM full context of the agent's journey.

## Objective

Refactor the AI player system to use persistent chat sessions instead of stateless API calls.

### Current Architecture (Stateless)
```
Each Turn:
  formatPrompt(view) → Gemini.generateContent() → parse response
  (no memory of previous turns)
```

### Target Architecture (Persistent Chat)
```
Initialization (first turn):
  Create ChatSession with system prompt + personality
  
Each Turn:
  Format turn-specific view as message → chat.sendMessage() → parse response
  (LLM sees entire conversation history)
```

## Requirements

### 1. Chat Session Management

Create a module to manage chat sessions per agent:

**File**: `src/ai-players/sessions.ts`

```typescript
import { ChatSession } from "@google/generative-ai";
import { AgentId, AgentIdentity } from "../shared/types.js";

// Store active chat sessions
const agentSessions = new Map<AgentId, ChatSession>();

/**
 * Initialize a new chat session for an agent
 */
export function initializeChat(agentId: AgentId, identity: AgentIdentity): ChatSession;

/**
 * Get existing chat session for an agent
 */
export function getChat(agentId: AgentId): ChatSession | undefined;

/**
 * Clear chat session (e.g., when agent dies)
 */
export function clearChat(agentId: AgentId): void;

/**
 * Clear all chat sessions (e.g., when simulation resets)
 */
export function clearAllChats(): void;
```

### 2. System Prompt (Initial Message)

Create a dedicated system prompt that sets up the agent's identity and personality. This is sent ONCE at the start of the chat.

**File**: Update `src/ai-players/prompt.ts`

```typescript
/**
 * Generate the initial system prompt for the chat session.
 * This is the first message in the conversation.
 */
export function formatSystemPrompt(identity: AgentIdentity): string {
  return `You are ${identity.name}, a creature in a 2D world of blocks. Your goal is to survive.

${identity.personality ? `YOUR PERSONALITY:\n${identity.personality}\n` : ""}

GAME RULES:
- You have hunger that decreases each turn. At 0 hunger, you die.
- You can gather resources (stone, wood, berries) from adjacent cells.
- You can build structures by placing blocks from your inventory.
- You can speak to other agents within your vision radius.
- You can hit adjacent agents to damage their hunger.
- You can eat berries to restore hunger.

Each turn, I will tell you what you see and your current status.
You must respond with:
THOUGHT: <your reasoning>
ACTION: <one action>

Acknowledge that you understand.`;
}

/**
 * Generate the per-turn prompt with current game state.
 * This is sent as a follow-up message each turn.
 */
export function formatTurnPrompt(view: AgentView): string {
  // Similar to current formatPrompt, but WITHOUT the personality/rules
  // (those are in the system prompt)
  return `
=== TURN ${view.turn} ===

YOUR STATUS:
- Position: (${view.self.position.x}, ${view.self.position.y})
- Hunger: ${view.self.hunger}/${view.self.maxHunger}
- Inventory: [${view.self.inventory.join(", ")}]

WHAT YOU SEE:
${formatGrid(view)}

NEARBY AGENTS:
${formatAgents(view)}

MESSAGES HEARD:
${formatMessages(view)}

What do you do?`;
}
```

### 3. Refactor getAction()

**File**: Update `src/ai-players/index.ts` and `src/ai-players/gemini.ts`

```typescript
export async function getAction(
  view: AgentView,
  identity: AgentIdentity
): Promise<{ action: Action; thought: string }> {
  // Get or create chat session
  let chat = getChat(identity.id);
  
  if (!chat) {
    // First turn for this agent - initialize chat with system prompt
    chat = initializeChat(identity.id, identity);
    
    // Send system prompt and wait for acknowledgment
    await chat.sendMessage(formatSystemPrompt(identity));
  }
  
  // Send current turn's view
  const turnPrompt = formatTurnPrompt(view);
  const result = await chat.sendMessage(turnPrompt);
  const responseText = result.response.text();
  
  // Parse and return
  return parseResponse(responseText);
}
```

### 4. Chat Initialization with Gemini API

**File**: Update `src/ai-players/gemini.ts`

```typescript
import { GoogleGenerativeAI, ChatSession } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

export function createChatSession(): ChatSession {
  return model.startChat({
    generationConfig: {
      temperature: 0.9,  // Some creativity
      maxOutputTokens: 500,
    },
  });
}
```

### 5. Session Lifecycle

- **Reset on simulation start**: Call `clearAllChats()` when a new simulation begins
- **Reset on agent death**: Call `clearChat(agentId)` when an agent dies
- **No reset on simulation pause/resume**: Sessions persist as long as simulation runs

Update `src/server/game-loop.ts` and `src/cli/runner.ts` to call session management functions at appropriate lifecycle points.

### 6. Dummy AI

Update `src/ai-players/dummy.ts` to optionally track "memory" too, even if it doesn't use it meaningfully. This keeps the interface consistent.

## Files to Read

1. **`src/ai-players/index.ts`** - Current stateless getAction implementation
2. **`src/ai-players/gemini.ts`** - Gemini API client
3. **`src/ai-players/prompt.ts`** - Current prompt formatting
4. **`@google/generative-ai` docs** - Chat session API: `model.startChat()`, `chat.sendMessage()`
5. **`src/server/game-loop.ts`** - Where to call session reset on game start
6. **`src/cli/runner.ts`** - Where to call session reset on simulation start

## Acceptance Criteria

- [ ] Each agent has a persistent chat session
- [ ] System prompt sent once at start of conversation
- [ ] Turn prompts sent as follow-up messages (no personality/rules repetition)
- [ ] Chat history persists across turns
- [ ] Sessions cleared when simulation resets
- [ ] Sessions cleared when agent dies
- [ ] Dummy AI maintains consistent interface
- [ ] All existing tests pass (may need updates)
- [ ] No lint errors

## Notes

**Token Limits**: For MVP, we're not implementing token limit handling. If simulations run very long (100s of turns), context may eventually exceed model limits. Future enhancement: summarize/truncate old history.

**Replay Implications**: Chat sessions are ephemeral (in-memory). Replays will not contain the exact chat history. This is acceptable for now. Future enhancement: serialize chat history to replay files.

**Temperature**: Using 0.9 for some personality variation. Can tune based on observed behavior.

**Response Format**: The LLM should maintain the `THOUGHT:` / `ACTION:` format. The system prompt sets this expectation once.

**Error Recovery**: If chat.sendMessage() fails, consider:
1. Retry the same message
2. Create new session and start fresh
3. Fall back to stateless call

For MVP, implement simple retry + fallback to stateless.

---

## 🎯 Completion Report

**Completed**: 2026-01-18

### Summary

Implemented persistent chat sessions for AI agents using the Gemini Chat API. Each agent now maintains a conversation history across turns, allowing the LLM to remember previous interactions and form coherent long-term behavior.

### Changes Made

| File | Change |
|------|--------|
| `src/ai-players/sessions.ts` | NEW - Chat session management with `initializeChat`, `getChat`, `clearChat`, `clearAllChats` |
| `src/ai-players/gemini.ts` | Added `createChatSession()` function |
| `src/ai-players/prompt.ts` | Added `formatSystemPrompt()` and `formatTurnPrompt()` for persistent chat |
| `src/ai-players/index.ts` | Refactored to use chat sessions with stateless fallback |
| `src/ai-players/dummy.ts` | Added `clearDummyMemory()` for consistent interface |
| `src/server/game-loop.ts` | Calls `clearAllChats()` on simulation start |
| `src/cli/runner.ts` | Calls `clearAllChats()` in constructor |
| `src/ai-players/ai-players.test.ts` | Added tests for new prompt functions (17 tests total) |

### Verification

- ✅ Build passes (`npm run build`)
- ✅ All 17 tests pass (`npm test src/ai-players/ai-players.test.ts`)
- ✅ No lint errors

