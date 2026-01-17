import { Action, AgentView, AgentIdentity } from "../shared/types.js";
import { callGemini } from "./gemini.js";
import { formatPrompt } from "./prompt.js";
import { parseAction } from "./parser.js";

/**
 * Gets the next action for an agent based on its view and identity.
 */
export async function getAction(view: AgentView, identity: AgentIdentity): Promise<Action> {
    const prompt = formatPrompt(view, identity);

    try {
        let response = await callGemini(prompt);
        let action = parseAction(response);

        // One retry if parsing fails
        if (!action) {
            console.warn(`[AI Player] Failed to parse action for ${identity.name}. Retrying once...`);
            const retryPrompt = `${prompt}\n\nNOTE: Your previous response was not recognized. Please respond with EXACTLY one action in the format: ACTION: type(params)`;
            response = await callGemini(retryPrompt);
            action = parseAction(response);
        }

        if (!action) {
            console.error(`[AI Player] Failed to parse action for ${identity.name} after retry. Defaulting to wait.`);
            return { type: "wait" };
        }

        // Log the thought if present
        const thoughtMatch = response.match(/THOUGHT:\s*(.+)/i);
        if (thoughtMatch) {
            console.log(`[AI Player] ${identity.name} thoughts: ${thoughtMatch[1].trim()}`);
        }
        console.log(`[AI Player] ${identity.name} action: ${JSON.stringify(action)}`);

        return action;
    } catch (error) {
        console.error(`[AI Player] Error getting action for ${identity.name}:`, error);
        // Default to wait on error
        return { type: "wait" };
    }
}
