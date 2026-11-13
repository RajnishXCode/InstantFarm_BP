
import type { OreDefinition } from "./types";

export const RADAR_CONFIG = {
    itemId: "instantfarm:ore_detector",

    // Scan volume around the player, in blocks.
    scanRadius: 32,

    // Ticks between full scans (20 ticks = 1 second).
    scanIntervalTicks: 20,

    // Ticks between held-item checks and display updates.
    updateIntervalTicks: 2,

    // Minimum ticks between changed-text updates while the player moves or turns.
    displayMinIntervalTicks: 4,

    // Re-send the actionbar at least this often so vanilla does not fade it out.
    displayRefreshTicks: 20,

    // Chunk ore lists are reused for this many ticks before being re-queried.
    chunkCacheTicks: 200,

    // Caches above this size are pruned of stale entries.
    chunkCachePruneSize: 512,

    // Upper bound on ore blocks verified per scan (nearest first).
    maxVerifiedBlocks: 128,

    // Ore blocks within this distance of each other belong to one vein.
    veinLinkDistance: 2,

    // Maximum number of veins listed under the radar grid.
    maxResults: 3,

    // Side length of a block-query cube. Matches Bedrock subchunks.
    chunkSize: 16
} as const;

export const ORE_DEFINITIONS: Readonly<Record<string, OreDefinition>> = {
    "minecraft:coal_ore": { name: "Coal", symbol: "C", color: "§8" },
    "minecraft:deepslate_coal_ore": { name: "Coal", symbol: "C", color: "§8" },

    "minecraft:iron_ore": { name: "Iron", symbol: "I", color: "§7" },
    "minecraft:deepslate_iron_ore": { name: "Iron", symbol: "I", color: "§7" },

    "minecraft:copper_ore": { name: "Copper", symbol: "U", color: "§3" },
    "minecraft:deepslate_copper_ore": { name: "Copper", symbol: "U", color: "§3" },

    "minecraft:gold_ore": { name: "Gold", symbol: "G", color: "§e" },
    "minecraft:deepslate_gold_ore": { name: "Gold", symbol: "G", color: "§e" },

    "minecraft:redstone_ore": { name: "Redstone", symbol: "R", color: "§4" },
    "minecraft:lit_redstone_ore": { name: "Redstone", symbol: "R", color: "§4" },
    "minecraft:deepslate_redstone_ore": { name: "Redstone", symbol: "R", color: "§4" },
    "minecraft:lit_deepslate_redstone_ore": { name: "Redstone", symbol: "R", color: "§4" },

    "minecraft:lapis_ore": { name: "Lapis", symbol: "L", color: "§9" },
    "minecraft:deepslate_lapis_ore": { name: "Lapis", symbol: "L", color: "§9" },

    "minecraft:diamond_ore": { name: "Diamond", symbol: "D", color: "§b" },
    "minecraft:deepslate_diamond_ore": { name: "Diamond", symbol: "D", color: "§b" },

    "minecraft:emerald_ore": { name: "Emerald", symbol: "E", color: "§a" },
    "minecraft:deepslate_emerald_ore": { name: "Emerald", symbol: "E", color: "§a" },

    "minecraft:nether_gold_ore": { name: "Nether Gold", symbol: "N", color: "§6" },
    "minecraft:quartz_ore": { name: "Nether Quartz", symbol: "Q", color: "§f" },
    "minecraft:ancient_debris": { name: "Ancient Debris", symbol: "A", color: "§5" }
};

export const ORE_BLOCK_IDS: string[] = Object.keys(ORE_DEFINITIONS);
