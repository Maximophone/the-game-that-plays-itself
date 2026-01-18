import { GoogleGenerativeAI, ChatSession } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY || "";

if (!API_KEY) {
    console.warn("WARNING: GEMINI_API_KEY environment variable is not set.");
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

// Retry configuration
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000; // Start with 1 second

/**
 * Sleep for a given number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Extract retry delay from error if available (Gemini API provides this).
 */
function getRetryDelayFromError(error: unknown): number | null {
    if (error && typeof error === "object" && "errorDetails" in error) {
        const details = (error as { errorDetails: Array<{ "@type": string; retryDelay?: string }> }).errorDetails;
        for (const detail of details) {
            if (detail["@type"] === "type.googleapis.com/google.rpc.RetryInfo" && detail.retryDelay) {
                // Parse "4s" or "4.5s" format
                const match = detail.retryDelay.match(/^([\d.]+)s$/);
                if (match) {
                    return Math.ceil(parseFloat(match[1]) * 1000);
                }
            }
        }
    }
    return null;
}

/**
 * Check if an error is a rate limit (429) error.
 */
function isRateLimitError(error: unknown): boolean {
    return !!(error && typeof error === "object" && "status" in error && (error as { status: number }).status === 429);
}

/**
 * Creates a new chat session for persistent conversation.
 * Used for agents to maintain memory across turns.
 */
export function createChatSession(): ChatSession {
    return model.startChat({
        generationConfig: {
            temperature: 0.9, // Some creativity for personality
            maxOutputTokens: 500,
        },
    });
}

/**
 * Calls Gemini 3.0 Flash with the provided prompt.
 * Includes exponential backoff retry for rate limit errors.
 * This is a stateless call - use createChatSession for persistent memory.
 */
export async function callGemini(prompt: string): Promise<string> {
    let lastError: unknown;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            lastError = error;

            if (isRateLimitError(error)) {
                // Get delay from error or calculate exponential backoff
                const apiDelay = getRetryDelayFromError(error);
                const backoffDelay = BASE_DELAY_MS * Math.pow(2, attempt);
                const delayMs = apiDelay || backoffDelay;

                console.warn(`[Gemini] Rate limited (429). Retrying in ${delayMs}ms... (attempt ${attempt + 1}/${MAX_RETRIES})`);
                await sleep(delayMs);
            } else {
                // Not a rate limit error, don't retry
                console.error("Error calling Gemini API:", error);
                throw error;
            }
        }
    }

    console.error(`[Gemini] Max retries (${MAX_RETRIES}) exceeded for rate limit.`);
    throw lastError;
}

/**
 * Wrapper for chat.sendMessage with retry logic for rate limits.
 */
export async function sendMessageWithRetry(
    chat: ChatSession,
    message: string
): Promise<string> {
    let lastError: unknown;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            const result = await chat.sendMessage(message);
            return result.response.text();
        } catch (error) {
            lastError = error;

            if (isRateLimitError(error)) {
                const apiDelay = getRetryDelayFromError(error);
                const backoffDelay = BASE_DELAY_MS * Math.pow(2, attempt);
                const delayMs = apiDelay || backoffDelay;

                console.warn(`[Gemini] Rate limited (429). Retrying in ${delayMs}ms... (attempt ${attempt + 1}/${MAX_RETRIES})`);
                await sleep(delayMs);
            } else {
                console.error("Error calling Gemini API:", error);
                throw error;
            }
        }
    }

    console.error(`[Gemini] Max retries (${MAX_RETRIES}) exceeded for rate limit.`);
    throw lastError;
}
