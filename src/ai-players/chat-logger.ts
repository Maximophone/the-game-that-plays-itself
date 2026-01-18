import { existsSync, mkdirSync, appendFileSync, writeFileSync } from "fs";
import { join } from "path";
import { AgentId } from "../shared/types.js";

/**
 * Logs chat history for each agent to markdown files for debugging.
 */

let logsDir: string = "./logs/chats";
let currentSessionId: string = "";

/**
 * Initialize a new logging session.
 */
export function initChatLogs(outputDir: string = "./logs/chats"): void {
    logsDir = outputDir;
    currentSessionId = new Date().toISOString().replace(/[:.]/g, "-");

    // Create logs directory if it doesn't exist
    const sessionDir = join(logsDir, currentSessionId);
    if (!existsSync(sessionDir)) {
        mkdirSync(sessionDir, { recursive: true });
    }

    console.log(`[Chat Logs] Initialized logging to ${sessionDir}`);
}

/**
 * Log a message exchange for an agent.
 */
export function logChatMessage(
    agentId: AgentId,
    agentName: string,
    role: "system" | "user" | "assistant",
    content: string,
    turn?: number
): void {
    if (!currentSessionId) {
        // Logging not initialized
        return;
    }

    const sessionDir = join(logsDir, currentSessionId);
    const logFile = join(sessionDir, `${agentName.toLowerCase().replace(/\s+/g, "_")}_${agentId}.md`);

    // Create file with header if it doesn't exist
    if (!existsSync(logFile)) {
        const header = `# Chat Log: ${agentName}\n\n**Agent ID**: ${agentId}  \n**Session**: ${currentSessionId}\n\n---\n\n`;
        writeFileSync(logFile, header, "utf-8");
    }

    // Format the message
    const timestamp = new Date().toISOString();
    const turnInfo = turn !== undefined ? ` (Turn ${turn})` : "";

    let formattedMessage = "";
    switch (role) {
        case "system":
            formattedMessage = `## 🔧 System${turnInfo}\n*${timestamp}*\n\n\`\`\`\n${content}\n\`\`\`\n\n`;
            break;
        case "user":
            formattedMessage = `## 📥 Prompt${turnInfo}\n*${timestamp}*\n\n\`\`\`\n${content}\n\`\`\`\n\n`;
            break;
        case "assistant":
            formattedMessage = `## 🤖 Response${turnInfo}\n*${timestamp}*\n\n\`\`\`json\n${content}\n\`\`\`\n\n---\n\n`;
            break;
    }

    appendFileSync(logFile, formattedMessage, "utf-8");
}

/**
 * Log a parsed action for an agent.
 */
export function logParsedAction(
    agentName: string,
    agentId: AgentId,
    thought: string,
    action: object,
    turn?: number
): void {
    if (!currentSessionId) return;

    const sessionDir = join(logsDir, currentSessionId);
    const logFile = join(sessionDir, `${agentName.toLowerCase().replace(/\s+/g, "_")}_${agentId}.md`);

    const turnInfo = turn !== undefined ? ` (Turn ${turn})` : "";
    const entry = `### ✅ Parsed Action${turnInfo}\n- **Thought**: ${thought || "(none)"}\n- **Action**: \`${JSON.stringify(action)}\`\n\n`;

    appendFileSync(logFile, entry, "utf-8");
}

/**
 * Clear the current session (call when simulation restarts).
 */
export function clearChatLogs(): void {
    currentSessionId = "";
}
