import { world, system } from "@minecraft/server";

const CROP_MAX_STATES: Record<string, number> = {
    "minecraft:wheat": 7,
    "minecraft:carrots": 7,
    "minecraft:potatoes": 7,
    "minecraft:beetroot": 7,
    "minecraft:melon_stem": 7,
    "minecraft:pumpkin_stem": 7,
    "minecraft:torchflower_crop": 1,
    "minecraft:pitcher_crop": 4
};

const TREE_FEATURES: Record<string, string> = {
    "minecraft:oak_sapling": "minecraft:oak_tree_feature",
    "minecraft:spruce_sapling": "minecraft:spruce_tree_feature",
    "minecraft:birch_sapling": "minecraft:birch_tree_feature",
    "minecraft:jungle_sapling": "minecraft:jungle_tree_feature",
    "minecraft:acacia_sapling": "minecraft:acacia_tree_feature",
    "minecraft:dark_oak_sapling": "minecraft:dark_oak_tree_feature",
    "minecraft:cherry_sapling": "minecraft:cherry_tree_feature"
};

// Listen for any block placement
world.afterEvents.playerPlaceBlock.subscribe((event) => {
    // Extract the player object alongside the block and dimension
    const { block, dimension, player } = event;
    const typeId = block.typeId;

    // SCENARIO A: The placed block is a Crop
    if (typeId in CROP_MAX_STATES) {
        const maxGrowth = CROP_MAX_STATES[typeId];
        
        system.run(() => {
            const fullyGrownPermutation = block.permutation.withState("growth", maxGrowth);
            block.setPermutation(fullyGrownPermutation);
        });
    } 
    
    // SCENARIO B: The placed block is a Tree Sapling
    else if (typeId in TREE_FEATURES) {
        const featureName = TREE_FEATURES[typeId];
        const { x, y, z } = block.location;

        system.run(() => {
            try {
                dimension.runCommand(`place feature ${featureName} ${x} ${y} ${z}`);
            } catch (error) {
                // Cast the error to a string and send it to the player's chat in red
                player.sendMessage(`§c[Debug Error] §eFailed to place ${featureName}: §f${String(error)}`);
            }
        });
    }
});