import { expect, test, describe, beforeAll, afterAll } from "vitest";
import * as fs from "fs";
import { ReplayWriter } from "./writer.js";
import { listReplays, loadReplay, checkCompatibility } from "./reader.js";
import { DEFAULT_CONFIG } from "../shared/types.js";
import type { GameState, Agent } from "../shared/types.js";

const TEST_DIR = "./test-replays";

describe("Replay System", () => {
    beforeAll(() => {
        if (!fs.existsSync(TEST_DIR)) {
            fs.mkdirSync(TEST_DIR);
        }
    });

    afterAll(() => {
        if (fs.existsSync(TEST_DIR)) {
            fs.rmSync(TEST_DIR, { recursive: true, force: true });
        }
    });

    test("ReplayWriter should create a file and append turns", async () => {
        const writer = new ReplayWriter(DEFAULT_CONFIG, TEST_DIR);

        const mockAgent: Agent = {
            id: "agent-1",
            name: "Test Agent",
            position: { x: 0, y: 0 },
            hunger: 100,
            inventory: [],
            color: "red",
            isAlive: true,
        };

        const initialState: GameState = {
            turn: 0,
            grid: { width: 10, height: 10, cells: [] },
            agents: new Map([["agent-1", mockAgent]]),
            messages: [],
            config: DEFAULT_CONFIG,
        };

        const filePath = writer.initialize(initialState);
        expect(fs.existsSync(filePath)).toBe(true);

        const state1: GameState = { ...initialState, turn: 1 };
        writer.appendTurn(state1);

        writer.finalize();

        const replay = await loadReplay(filePath);
        expect(replay.metadata.status).toBe("completed");
        expect(replay.metadata.finalTurn).toBe(1);
        expect(replay.turns.length).toBe(2);
        expect(replay.turns[0].turn).toBe(0);
        expect(replay.turns[1].turn).toBe(1);

        // Check Map restoration
        expect(replay.turns[0].agents instanceof Map).toBe(true);
        const restoredAgent = (replay.turns[0].agents as unknown as Map<string, Agent>).get("agent-1");
        expect(restoredAgent?.name).toBe("Test Agent");
    });

    test("listReplays should return available replays", async () => {
        const replays = await listReplays(TEST_DIR);
        expect(replays.length).toBeGreaterThan(0);
        expect(replays[0].metadata).toBeDefined();
    });

    test("checkCompatibility should handle version mismatches", () => {
        const perfectMatch = { engineVersion: "0.1.0" } as any;
        expect(checkCompatibility(perfectMatch).compatible).toBe(true);
        expect(checkCompatibility(perfectMatch).warning).toBeUndefined();

        const minorMismatch = { engineVersion: "0.1.5" } as any;
        expect(checkCompatibility(minorMismatch).compatible).toBe(true);
        expect(checkCompatibility(minorMismatch).warning).toContain("Minor version mismatch");

        const majorMismatch = { engineVersion: "1.0.0" } as any;
        expect(checkCompatibility(majorMismatch).compatible).toBe(false);
        expect(checkCompatibility(majorMismatch).warning).toContain("Major version mismatch");
    });
});
