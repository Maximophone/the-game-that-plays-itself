import { Action, AgentView, AgentIdentity } from "../shared/types.js";
import { callGemini, sendMessageWithRetry } from "./gemini.js";
import { formatPrompt, formatTurnPrompt } from "./prompt.js";
import { parseJsonResponse } from "./parser.js";
import { getChat, initializeChat } from "./sessions.js";
import { logChatMessage, logParsedAction } from "./chat-logger.js";

/**
 * Gets the next action for an agent based on its view and identity.
 * Uses persistent chat sessions to maintain memory across turns.
 */
export async function getAction(view: AgentView, identity: AgentIdentity): Promise<{ action: Action; thought: string }> {
    const turn = view.turn;

    try {
        // Try to use chat session for persistent memory
        let chat = getChat(identity.id);
        let response: string;

        if (!chat) {
            // First turn for this agent - initialize chat with system prompt
            console.log(`[AI Player] Initializing chat session for ${identity.name}`);
            chat = await initializeChat(identity.id, identity);
        }

        // Send turn-specific prompt
        const turnPrompt = formatTurnPrompt(view);

        // Log the turn prompt
        logChatMessage(identity.id, identity.name, "user", turnPrompt, turn);

        response = await sendMessageWithRetry(chat, turnPrompt);

        // Log the response
        logChatMessage(identity.id, identity.name, "assistant", response, turn);

        // Parse the JSON response
        let parsed = parseJsonResponse(response);

        // One retry if parsing fails
        if (!parsed) {
            console.warn(`[AI Player] Failed to parse JSON for ${identity.name}. Retrying...`);
            console.warn(`[AI Player] Raw response: ${response.substring(0, 300)}`);
            const retryPrompt = `Your response was not valid JSON. You MUST respond with ONLY a JSON object like this:
{"thought": "your reasoning here", "action": "move", "direction": "up"}

Valid actions: move, gather, hit, build, speak, wait, eat
For move/gather/hit: include "direction" (up/down/left/right)
For speak: include "message"
For build: include "direction" and "block"

Respond now with valid JSON:`;

            logChatMessage(identity.id, identity.name, "user", retryPrompt, turn);

            response = await sendMessageWithRetry(chat, retryPrompt);

            logChatMessage(identity.id, identity.name, "assistant", response, turn);

            parsed = parseJsonResponse(response);
        }

        if (!parsed) {
            console.error(`[AI Player] Failed to parse JSON for ${identity.name} after retry. Defaulting to wait.`);
            console.error(`[AI Player] Final response: ${response.substring(0, 300)}`);
            return { action: { type: "wait" }, thought: "Failed to process decision" };
        }

        // Log the parsed action
        logParsedAction(identity.name, identity.id, parsed.thought, parsed.action, turn);

        if (parsed.thought) {
            console.log(`[AI Player] ${identity.name} thoughts: ${parsed.thought}`);
        }
        console.log(`[AI Player] ${identity.name} action: ${JSON.stringify(parsed.action)}`);

        return { action: parsed.action, thought: parsed.thought };
    } catch (error) {
        console.error(`[AI Player] Chat session error for ${identity.name}, falling back to stateless:`, error);

        // Fallback to stateless call
        return getActionStateless(view, identity);
    }
}

/**
 * Stateless fallback - used when chat session fails.
 * This is the original implementation without memory.
 */
async function getActionStateless(view: AgentView, identity: AgentIdentity): Promise<{ action: Action; thought: string }> {
    // For stateless, we use the full prompt which includes JSON format instructions
    const prompt = `${formatPrompt(view, identity)}

Respond with a JSON object like: {"thought": "reasoning", "action": "move", "direction": "up"}`;

    try {
        let response = await callGemini(prompt);
        let parsed = parseJsonResponse(response);

        // One retry if parsing fails
        if (!parsed) {
            console.warn(`[AI Player] [Stateless] Failed to parse JSON for ${identity.name}. Retrying...`);
            const retryPrompt = `${prompt}\n\nYour response must be valid JSON. Example: {"thought": "I need food", "action": "gather", "direction": "right"}`;
            response = await callGemini(retryPrompt);
            parsed = parseJsonResponse(response);
        }

        if (!parsed) {
            console.error(`[AI Player] [Stateless] Failed to parse JSON for ${identity.name} after retry. Defaulting to wait.`);
            return { action: { type: "wait" }, thought: "Failed to process decision" };
        }

        if (parsed.thought) {
            console.log(`[AI Player] ${identity.name} thoughts: ${parsed.thought}`);
        }
        console.log(`[AI Player] ${identity.name} action: ${JSON.stringify(parsed.action)}`);

        return { action: parsed.action, thought: parsed.thought };
    } catch (error) {
        console.error(`[AI Player] Error getting action for ${identity.name}:`, error);
        // Default to wait on error
        return { action: { type: "wait" }, thought: "Error occurred" };
    }
}

