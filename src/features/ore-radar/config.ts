
export const RADAR_CONFIG = {
    radius: 24,
    scanIntervalTicks: 40, // 2 seconds
    maxTargets: 3,
    scanCandidates: 24,

    // Prevent multiple blocks from one ore vein
    veinSeparation: 3
} as const;

export const ORE_BLOCKS: Record<string, string> = {
    "minecraft:coal_ore": "Coal",
    "minecraft:deepslate_coal_ore": "Coal",

    "minecraft:iron_ore": "Iron",
    "minecraft:deepslate_iron_ore": "Iron",

    "minecraft:copper_ore": "Copper",
    "minecraft:deepslate_copper_ore": "Copper",

    "minecraft:gold_ore": "Gold",
    "minecraft:deepslate_gold_ore": "Gold",

    "minecraft:redstone_ore": "Redstone",
    "minecraft:lit_redstone_ore": "Redstone",
    "minecraft:deepslate_redstone_ore": "Redstone",
    "minecraft:lit_deepslate_redstone_ore": "Redstone",

    "minecraft:lapis_ore": "Lapis",
    "minecraft:deepslate_lapis_ore": "Lapis",

    "minecraft:diamond_ore": "Diamond",
    "minecraft:deepslate_diamond_ore": "Diamond",

    "minecraft:emerald_ore": "Emerald",
    "minecraft:deepslate_emerald_ore": "Emerald",

    "minecraft:nether_quartz_ore": "Quartz",
    "minecraft:nether_gold_ore": "Nether Gold",
    "minecraft:ancient_debris": "Ancient Debris"
};

export const ORE_BLOCK_IDS = Object.keys(ORE_BLOCKS);
