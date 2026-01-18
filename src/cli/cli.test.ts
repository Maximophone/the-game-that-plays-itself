import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { SimulationRunner } from "./runner.js";
import * as fs from "fs";
import * as path from "path";

describe("SimulationRunner Integration", () => {
    const testOutputDir = "./test-replays";

    beforeEach(() => {
        if (!fs.existsSync(testOutputDir)) {
            fs.mkdirSync(testOutputDir);
        }
    });

    afterEach(() => {
        // Clean up test replays
        if (fs.existsSync(testOutputDir)) {
            const files = fs.readdirSync(testOutputDir);
            for (const file of files) {
                fs.unlinkSync(path.join(testOutputDir, file));
            }
            fs.rmdirSync(testOutputDir);
        }
    });

    it("should run a short simulation and generate a replay file", async () => {
        const runner = new SimulationRunner({
            agents: 2,
            width: 10,
            height: 10,
            turnDelay: 10,
            outputDir: testOutputDir,
            useDummyAi: true
        });

        // Run for a short time
        const startPromise = runner.start();

        // Wait for a few turns (turn 0 is initial, so we wait for turn 1 and 2)
        await new Promise(resolve => setTimeout(resolve, 50));

        runner.stop();
        await startPromise;

        // Verify replay file exists
        const files = fs.readdirSync(testOutputDir).filter(f => f.endsWith(".json"));
        expect(files.length).toBe(1);
        const replayContent = JSON.parse(fs.readFileSync(path.join(testOutputDir, files[0]), "utf-8"));
        expect(replayContent.metadata.status).toBe("completed");
        expect(replayContent.turns.length).toBeGreaterThan(0);
        expect(replayContent.metadata.config.gridWidth).toBe(10);
    });
});
