import { describe, it, expect } from "vitest";
import { formatPrompt } from "./prompt.js";
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

    describe("formatPrompt", () => {
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

    describe("parseAction", () => {
        it("should parse move(direction)", () => {
            expect(parseAction("ACTION: move(up)")).toEqual({ type: "move", direction: "up" });
            expect(parseAction("move(down)")).toEqual({ type: "move", direction: "down" });
        });

        it("should parse gather(direction)", () => {
            expect(parseAction("ACTION: gather(left)")).toEqual({ type: "gather", direction: "left" });
        });

        it("should parse build(direction, block)", () => {
            expect(parseAction("ACTION: build(right, stone)")).toEqual({ type: "build", direction: "right", block: "stone" });
        });

        it("should parse speak(\"message\")", () => {
            expect(parseAction("ACTION: speak(\"Hello world\")")).toEqual({ type: "speak", message: "Hello world" });
        });

        it("should parse wait and eat", () => {
            expect(parseAction("ACTION: wait")).toEqual({ type: "wait" });
            expect(parseAction("eat")).toEqual({ type: "eat" });
        });

        it("should return null on invalid action", () => {
            expect(parseAction("I don't know what to do")).toBeNull();
        });
    });
});
