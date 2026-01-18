import { GoogleGenerativeAI, ChatSession } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY || "";

if (!API_KEY) {
    console.warn("WARNING: GEMINI_API_KEY environment variable is not set.");
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

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
 * This is a stateless call - use createChatSession for persistent memory.
 */
export async function callGemini(prompt: string): Promise<string> {
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw error;
    }
}

