// import { world, system } from "@minecraft/server";

// // Listen for any block being placed in the world
// world.afterEvents.playerPlaceBlock.subscribe((event) => {
//     const { block } = event;

//     // List of crops we want to instantly grow
//     const crops = [
//         "minecraft:wheat", 
//         "minecraft:carrots", 
//         "minecraft:potatoes",
//         "minecraft:beetroots",
        
//     ];

//     if (crops.includes(block.typeId)) {
//         // Delay by 1 tick to safely modify the block state immediately after placement
//         system.run(() => {
//             // Find the maximum growth state for the crop (7 is max for wheat/carrots/potatoes)
//             const fullyGrown = block.permutation.withState("growth", 7);
            
//             // Apply the fully grown state to the block
//             block.setPermutation(fullyGrown);
//         });
//     }
// });


import { world, system } from "@minecraft/server";

// 1. Dictionary for Crops: Maps the block ID to its maximum "growth" state
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

// 2. Dictionary for Trees: Maps the sapling ID to its generation feature
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
    const { block, dimension } = event;
    const typeId = block.typeId;

    // SCENARIO A: The placed block is a Crop
    if (typeId in CROP_MAX_STATES) {
        const maxGrowth = CROP_MAX_STATES[typeId];
        
        system.run(() => {
            // Fetch the current permutation and modify the growth state
            const fullyGrownPermutation = block.permutation.withState("growth", maxGrowth);
            block.setPermutation(fullyGrownPermutation);
        });
    } 
    
    // SCENARIO B: The placed block is a Tree Sapling
    else if (typeId in TREE_FEATURES) {
        const featureName = TREE_FEATURES[typeId];
        const { x, y, z } = block.location;

        // Tick 1: Remove the sapling to clear the space
        system.run(() => {
            block.setType("minecraft:air");
            
            // Tick 2: Wait one additional game tick for the world to register the air block
            system.run(() => {
                try {
                    // Attempt to generate the tree feature
                    dimension.runCommand(`place feature ${featureName} ${x} ${y} ${z}`);
                } catch (error) {
                    // If the command fails (e.g., obstructed by a roof or other blocks),
                    // the code falls back here and safely returns the sapling to the ground.
                    block.setType(typeId);
                }
            });
        });
    }


});