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
    "minecraft:acacia_sapling": "minecraft:savanna_tree_feature",
    "minecraft:dark_oak_sapling": "minecraft:roofed_tree_feature",
    "minecraft:cherry_sapling": "minecraft:cherry_tree_feature"
};

// Listen for any block placement
world.afterEvents.playerPlaceBlock.subscribe((event) => {
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

        // Tick 1: We MUST delete the sapling to make the block "air".
        // Otherwise, the game engine thinks the space is occupied and aborts the tree.
        system.run(() => {
            block.setType("minecraft:air");
            
            // Tick 2: Wait for the air block to register, then force the tree.
            system.run(() => {
                try {
                    // Capture the result of the command execution
                    const result = dimension.runCommand(`place feature ${featureName} ${x} ${y} ${z}`);
                    
                    // If the command ran but placed 0 blocks (e.g. you were standing inside it,
                    // or it hit a ceiling, or it lacked space to grow), restore the sapling.
                    if (result.successCount === 0) {
                        block.setType(typeId);
                        player.sendMessage(`§e[Debug] Tree blocked! Ensure you have space and aren't standing inside the block.`);
                    }
                } catch (error) {
                    // Syntax error or complete engine crash
                    block.setType(typeId);
                    player.sendMessage(`§c[Debug Error] §f${String(error)}`);
                }
            });
        });
    }
});