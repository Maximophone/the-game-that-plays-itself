/**
 * Chat Session Management
 *
 * Manages persistent chat sessions per agent using the Gemini Chat API.
 * Each agent maintains a conversation history across turns.
 */

import { ChatSession } from "@google/generative-ai";
import { AgentId, AgentIdentity } from "../shared/types.js";
import { createChatSession, sendMessageWithRetry } from "./gemini.js";
import { formatSystemPrompt } from "./prompt.js";
import { initChatLogs, logChatMessage, clearChatLogs } from "./chat-logger.js";

// Store active chat sessions per agent
const agentSessions = new Map<AgentId, ChatSession>();

// Store agent names for logging
const agentNames = new Map<AgentId, string>();

/**
 * Initialize a new chat session for an agent.
 * Sends the system prompt to establish identity and rules.
 */
export async function initializeChat(
    agentId: AgentId,
    identity: AgentIdentity
): Promise<ChatSession> {
    const chat = createChatSession();

    // Send system prompt to establish context
    const systemPrompt = formatSystemPrompt(identity);

    // Log the system prompt
    logChatMessage(agentId, identity.name, "system", systemPrompt);

    const responseText = await sendMessageWithRetry(chat, systemPrompt);

    // Log the initial response
    logChatMessage(agentId, identity.name, "assistant", responseText);

    // Store the session and name
    agentSessions.set(agentId, chat);
    agentNames.set(agentId, identity.name);

    console.log(`[Sessions] Initialized chat session for ${identity.name}`);
    return chat;
}

/**
 * Get existing chat session for an agent.
 * Returns undefined if no session exists.
 */
export function getChat(agentId: AgentId): ChatSession | undefined {
    return agentSessions.get(agentId);
}

/**
 * Get agent name for logging purposes.
 */
export function getAgentName(agentId: AgentId): string {
    return agentNames.get(agentId) || agentId;
}

/**
 * Clear chat session for a specific agent.
 * Call this when an agent dies.
 */
export function clearChat(agentId: AgentId): void {
    if (agentSessions.has(agentId)) {
        agentSessions.delete(agentId);
        agentNames.delete(agentId);
        console.log(`[Sessions] Cleared chat session for agent ${agentId}`);
    }
}

/**
 * Clear all chat sessions and reset logging.
 * Call this when simulation resets or a new game starts.
 */
export function clearAllChats(): void {
    const count = agentSessions.size;
    agentSessions.clear();
    agentNames.clear();
    clearChatLogs();

    // Initialize new logging session
    initChatLogs();

    if (count > 0) {
        console.log(`[Sessions] Cleared ${count} chat session(s)`);
    }
}

