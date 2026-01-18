import * as fs from "fs";
import * as path from "path";
import type { ReplayFile, ReplayMetadata, ReplayInfo } from "../shared/replay-types.js";
import { ENGINE_VERSION } from "../shared/version.js";

/**
 * List all replay files in the given directory.
 */
export async function listReplays(dir: string = "./replays"): Promise<ReplayInfo[]> {
    if (!fs.existsSync(dir)) {
        return [];
    }

    const files = fs.readdirSync(dir);
    const replays: ReplayInfo[] = [];

    for (const file of files) {
        if (file.endsWith(".json")) {
            const filePath = path.join(dir, file);
            try {
                const metadata = await loadReplayMetadata(filePath);
                replays.push({
                    filePath,
                    fileName: file,
                    metadata,
                });
            } catch (err) {
                console.warn(`Failed to read metadata for ${file}:`, err);
            }
        }
    }

    // Sort by creation time (newest first)
    return replays.sort((a, b) =>
        new Date(b.metadata.createdAt).getTime() - new Date(a.metadata.createdAt).getTime()
    );
}

/**
 * Load a full replay file and convert serialized data back to runtime types.
 */
export async function loadReplay(filePath: string): Promise<ReplayFile> {
    const content = fs.readFileSync(filePath, "utf-8");
    const replay = JSON.parse(content) as ReplayFile;
    // Keep agents as objects - the frontend will convert to Map if needed
    return replay;
}

/**
 * Load only the metadata from a replay file (optimized).
 */
export async function loadReplayMetadata(filePath: string): Promise<ReplayMetadata> {
    const content = fs.readFileSync(filePath, "utf-8");
    const replay = JSON.parse(content) as ReplayFile;
    return replay.metadata;
}

/**
 * Check if a replay is compatible with the current engine version.
 */
export function checkCompatibility(metadata: ReplayMetadata): {
    compatible: boolean;
    warning?: string;
} {
    const current = ENGINE_VERSION.split(".").map(Number);
    const received = metadata.engineVersion.split(".").map(Number);

    const [cMajor, cMinor, cPatch] = current;
    const [rMajor, rMinor, rPatch] = received;

    if (cMajor !== rMajor) {
        return {
            compatible: false,
            warning: `Major version mismatch (Engine: ${ENGINE_VERSION}, Replay: ${metadata.engineVersion}). Playback may fail.`,
        };
    }

    if (cMinor !== rMinor || cPatch !== rPatch) {
        return {
            compatible: true,
            warning: `Minor version mismatch (Engine: ${ENGINE_VERSION}, Replay: ${metadata.engineVersion}). Minor issues may occur.`,
        };
    }

    return { compatible: true };
}
