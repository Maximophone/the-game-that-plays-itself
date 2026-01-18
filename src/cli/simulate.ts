import "dotenv/config";
import { Command } from "commander";
import { SimulationRunner } from "./runner.js";

const program = new Command();

program
    .name("simulate")
    .description("Run an autonomous game simulation and write replays to files")
    .version("0.1.0");

program
    .option("-a, --agents <number>", "Number of AI agents", "4")
    .option("-w, --width <number>", "Grid width", "20")
    .option("-h, --height <number>", "Grid height", "20")
    .option("-d, --turn-delay <ms>", "Milliseconds between turns", "0")
    .option("-o, --output <dir>", "Directory for replay files", "./replays")
    .option("--dummy-ai", "Use dummy AI instead of Gemini", false);

program.parse(process.argv);

const options = program.opts();

const runner = new SimulationRunner({
    agents: parseInt(options.agents, 10),
    width: parseInt(options.width, 10),
    height: parseInt(options.height, 10),
    turnDelay: parseInt(options.turnDelay, 10),
    outputDir: options.output,
    useDummyAi: options.dummyAi === true || !process.env.GEMINI_API_KEY,
});

/**
 * Handle graceful shutdown
 */
function handleShutdown() {
    runner.stop();
    process.exit(0);
}

process.on("SIGINT", handleShutdown);
process.on("SIGTERM", handleShutdown);

// Start the simulation
runner.start().catch(error => {
    console.error("[Simulation] Fatal error:", error);
    process.exit(1);
});
