import { Action, Direction, BlockType } from "../shared/types.js";

const VALID_DIRECTIONS = ["up", "down", "left", "right"];

interface JsonResponse {
    thought?: string;
    action?: string;
    direction?: string;
    message?: string;
    block?: string;
}

/**
 * Parses the LLM's JSON response to extract an Action and thought.
 * Returns both the parsed action and the thought for logging.
 */
export function parseJsonResponse(response: string): { action: Action; thought: string } | null {
    try {
        // Try to extract JSON from the response
        const jsonStr = extractJson(response);
        if (!jsonStr) {
            return null;
        }

        const parsed: JsonResponse = JSON.parse(jsonStr);

        // Extract thought (must be present)
        const thought = parsed.thought || "";

        // Extract action type
        const actionType = parsed.action?.toLowerCase();
        if (!actionType) {
            return null;
        }

        // Build the action object based on type
        let action: Action | null = null;

        switch (actionType) {
            case "move":
                if (isValidDirection(parsed.direction)) {
                    action = { type: "move", direction: parsed.direction as Direction };
                }
                break;
            case "gather":
                if (isValidDirection(parsed.direction)) {
                    action = { type: "gather", direction: parsed.direction as Direction };
                }
                break;
            case "build":
                if (isValidDirection(parsed.direction) && parsed.block) {
                    action = {
                        type: "build",
                        direction: parsed.direction as Direction,
                        block: parsed.block.toLowerCase() as BlockType
                    };
                }
                break;
            case "speak":
                if (parsed.message) {
                    action = { type: "speak", message: parsed.message };
                }
                break;
            case "hit":
                if (isValidDirection(parsed.direction)) {
                    action = { type: "hit", direction: parsed.direction as Direction };
                }
                break;
            case "wait":
                action = { type: "wait" };
                break;
            case "eat":
                action = { type: "eat" };
                break;
            case "think":
                // For think action, use the thought from the JSON or a separate field
                action = { type: "think", thought: parsed.thought || thought };
                break;
        }

        if (action) {
            return { action, thought };
        }
        return null;
    } catch (error) {
        // JSON parsing failed
        return null;
    }
}

/**
 * Extract JSON object from a response that might contain extra text.
 */
function extractJson(response: string): string | null {
    // Try to find JSON object in the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        return jsonMatch[0];
    }
    return null;
}

function isValidDirection(dir: string | undefined): dir is Direction {
    return !!dir && VALID_DIRECTIONS.includes(dir.toLowerCase());
}

/**
 * Legacy parser for backward compatibility.
 * @deprecated Use parseJsonResponse instead
 */
export function parseAction(response: string): Action | null {
    const result = parseJsonResponse(response);
    return result ? result.action : null;
}


