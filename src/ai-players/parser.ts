import { Action, Direction, BlockType } from "../shared/types.js";

/**
 * Parses the LLM's response to extract an Action.
 * Expects format: "ACTION: type(params)" or just "type(params)".
 */
export function parseAction(response: string): Action | null {
    // Look for the ACTION line
    const actionMatch = response.match(/ACTION:\s*(.+)/i);
    const actionStr = actionMatch ? actionMatch[1].trim() : response.trim();

    // move(direction)
    const moveMatch = actionStr.match(/^move\((up|down|left|right)\)$/i);
    if (moveMatch) {
        return { type: "move", direction: moveMatch[1].toLowerCase() as Direction };
    }

    // gather(direction)
    const gatherMatch = actionStr.match(/^gather\((up|down|left|right)\)$/i);
    if (gatherMatch) {
        return { type: "gather", direction: gatherMatch[1].toLowerCase() as Direction };
    }

    // build(direction, block)
    const buildMatch = actionStr.match(/^build\((up|down|left|right),\s*([a-z_]+)\)$/i);
    if (buildMatch) {
        return {
            type: "build",
            direction: buildMatch[1].toLowerCase() as Direction,
            block: buildMatch[2].toLowerCase() as BlockType
        };
    }

    // speak("message")
    const speakMatch = actionStr.match(/^speak\("(.+)"\)$/i);
    if (speakMatch) {
        return { type: "speak", message: speakMatch[1] };
    }

    // hit(direction)
    const hitMatch = actionStr.match(/^hit\((up|down|left|right)\)$/i);
    if (hitMatch) {
        return { type: "hit", direction: hitMatch[1].toLowerCase() as Direction };
    }

    // wait
    if (actionStr.toLowerCase() === "wait") {
        return { type: "wait" };
    }

    // eat
    if (actionStr.toLowerCase() === "eat") {
        return { type: "eat" };
    }

    // think("thought")
    const thinkMatch = actionStr.match(/^think\("(.+)"\)$/i);
    if (thinkMatch) {
        return { type: "think", thought: thinkMatch[1] };
    }

    // Last resort: try to find any of the keywords
    if (actionStr.toLowerCase().includes("wait")) return { type: "wait" };
    if (actionStr.toLowerCase().includes("eat")) return { type: "eat" };

    return null;
}
