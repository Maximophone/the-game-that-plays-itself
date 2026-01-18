import { describe, it, expect } from "vitest";
import { formatPrompt, formatSystemPrompt, formatTurnPrompt } from "./prompt.js";
import { parseAction } from "./parser.js";
import { AgentView, AgentIdentity } from "../shared/types.js";

describe("AI Player Component", () => {
    const mockIdentity: AgentIdentity = {
        id: "agent-1",
        name: "Aria",
        personality: "Helpful and cautious."
    };

    const mockView: AgentView = {
        self: {
            id: "agent-1",
            name: "Aria",
            position: { x: 5, y: 5 },
            hunger: 70,
            maxHunger: 100,
            inventory: ["berry"],
            inventoryCapacity: 5
        },
        visibleCells: [
            { relativePosition: { x: 0, y: 0 }, absolutePosition: { x: 5, y: 5 }, terrain: "grass", block: null },
            { relativePosition: { x: 1, y: 0 }, absolutePosition: { x: 6, y: 5 }, terrain: "grass", block: "berry_bush" }
        ],
        visibleAgents: [],
        recentMessages: [],
        turn: 10
    };

    describe("formatSystemPrompt (persistent chat)", () => {
        it("should include agent name and personality", () => {
            const prompt = formatSystemPrompt(mockIdentity);
            expect(prompt).toContain("Aria");
            expect(prompt).toContain("Helpful and cautious.");
        });

        it("should include game rules", () => {
            const prompt = formatSystemPrompt(mockIdentity);
            expect(prompt).toContain("GAME RULES:");
            expect(prompt).toContain("hunger that decreases each turn");
            expect(prompt).toContain("gather resources");
        });

        it("should specify JSON response format", () => {
            const prompt = formatSystemPrompt(mockIdentity);
            expect(prompt).toContain("JSON object");
            expect(prompt).toContain("\"thought\"");
            expect(prompt).toContain("\"action\"");
        });

        it("should include available actions", () => {
            const prompt = formatSystemPrompt(mockIdentity);
            expect(prompt).toContain("move:");
            expect(prompt).toContain("gather");
            expect(prompt).toContain("eat");
        });
    });

    describe("formatTurnPrompt (persistent chat)", () => {
        it("should include turn number", () => {
            const prompt = formatTurnPrompt(mockView);
            expect(prompt).toContain("TURN 10");
        });

        it("should include status without personality", () => {
            const prompt = formatTurnPrompt(mockView);
            expect(prompt).toContain("Hunger: 70/100");
            expect(prompt).toContain("Inventory: [berry]");
            // Should NOT include personality (that's in system prompt)
            expect(prompt).not.toContain("Helpful and cautious");
        });

        it("should format grid", () => {
            const prompt = formatTurnPrompt(mockView);
            expect(prompt).toContain("WHAT YOU SEE:");
            expect(prompt).toContain("@"); // Agent marker
        });

        it("should request JSON response", () => {
            const prompt = formatTurnPrompt(mockView);
            expect(prompt).toContain("JSON object");
        });
    });

    describe("formatPrompt (stateless fallback)", () => {
        it("should include agent name and personality", () => {
            const prompt = formatPrompt(mockView, mockIdentity);
            expect(prompt).toContain("Aria");
            expect(prompt).toContain("Helpful and cautious.");
        });

        it("should include hunger and inventory", () => {
            const prompt = formatPrompt(mockView, mockIdentity);
            expect(prompt).toContain("Hunger: 70/100");
            expect(prompt).toContain("Inventory: [berry]");
        });

        it("should format the grid with legend", () => {
            const prompt = formatPrompt(mockView, mockIdentity);
            expect(prompt).toContain("=== WHAT YOU SEE ===");
            expect(prompt).toContain("Legend: @=you, P=player, S=stone, W=wood, B=bush, b=berry, .=grass");
        });
    });

    describe("parseAction (JSON format)", () => {
        it("should parse move action", () => {
            expect(parseAction('{"thought": "exploring", "action": "move", "direction": "up"}')).toEqual({ type: "move", direction: "up" });
            expect(parseAction('{"thought": "", "action": "move", "direction": "down"}')).toEqual({ type: "move", direction: "down" });
        });

        it("should parse gather action", () => {
            expect(parseAction('{"thought": "getting food", "action": "gather", "direction": "left"}')).toEqual({ type: "gather", direction: "left" });
        });

        it("should parse build action", () => {
            expect(parseAction('{"thought": "building", "action": "build", "direction": "right", "block": "stone"}')).toEqual({ type: "build", direction: "right", block: "stone" });
        });

        it("should parse speak action", () => {
            expect(parseAction('{"thought": "greeting", "action": "speak", "message": "Hello world"}')).toEqual({ type: "speak", message: "Hello world" });
        });

        it("should parse wait and eat", () => {
            expect(parseAction('{"thought": "resting", "action": "wait"}')).toEqual({ type: "wait" });
            expect(parseAction('{"thought": "hungry", "action": "eat"}')).toEqual({ type: "eat" });
        });

        it("should return null on invalid action", () => {
            expect(parseAction("I don't know what to do")).toBeNull();
            expect(parseAction('{"thought": "test"}')).toBeNull(); // missing action
        });

        it("should extract JSON from text with extra content", () => {
            expect(parseAction('Here is my response: {"thought": "test", "action": "wait"}')).toEqual({ type: "wait" });
        });

        it("should handle missing direction for move", () => {
            expect(parseAction('{"thought": "test", "action": "move"}')).toBeNull();
        });
    });
});

