import * as fs from "fs";
import * as path from "path";
import type { GameConfig, GameState } from "../shared/types.js";
import type { ReplayFile, ReplayMetadata, ReplayTurn } from "../shared/replay-types.js";
import { ENGINE_VERSION } from "../shared/version.js";

export class ReplayWriter {
    private filePath: string;
    private metadata: ReplayMetadata;
    private turns: ReplayTurn[] = [];
    private outputDir: string;

    constructor(config: GameConfig, outputDir: string = "./replays") {
        this.outputDir = outputDir;
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const fileName = `replay_${timestamp}.json`;
        this.filePath = path.join(this.outputDir, fileName);

        this.metadata = {
            engineVersion: ENGINE_VERSION,
            createdAt: new Date().toISOString(),
            lastUpdatedAt: new Date().toISOString(),
            config,
            finalTurn: 0,
            status: "running",
        };
    }

    /**
     * Initialize the replay file with the initial state.
     */
    public initialize(initialState: GameState): string {
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }

        this.appendTurn(initialState);
        this.save();
        return this.filePath;
    }

    /**
     * Append a turn snapshot to the replay.
     */
    public appendTurn(state: GameState): void {
        const serializedTurn: ReplayTurn = {
            ...state,
            agents: Object.fromEntries(state.agents),
        };

        this.turns.push(serializedTurn);
        this.metadata.finalTurn = state.turn;
        this.metadata.lastUpdatedAt = new Date().toISOString();
        this.save();
    }

    /**
     * Mark the replay as completed.
     */
    public finalize(): void {
        this.metadata.status = "completed";
        this.save();
    }

    /**
     * Mark the replay as crashed.
     */
    public markCrashed(error?: Error): void {
        this.metadata.status = "crashed";
        if (error) {
            this.metadata.error = error.message;
        }
        this.save();
    }

    /**
     * Atomic save: write to .tmp and rename.
     * Note: For simplicity in this MVP, we are re-writing the whole file.
     * Incremental appends to a JSON array in a file can be complex;
     * full state snapshots are small enough for now.
     */
    private save(): void {
        const replayFile: ReplayFile = {
            metadata: this.metadata,
            turns: this.turns,
        };

        const tmpPath = `${this.filePath}.tmp`;
        const content = JSON.stringify(replayFile, null, 2);

        try {
            fs.writeFileSync(tmpPath, content);
            fs.renameSync(tmpPath, this.filePath);
        } catch (err) {
            console.error(`Failed to save replay to ${this.filePath}:`, err);
        }
    }

    public getFilePath(): string {
        return this.filePath;
    }
}
