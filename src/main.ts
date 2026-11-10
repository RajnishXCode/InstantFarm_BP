
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
    "minecraft:spruce_sapling": "minecraft:select_spruce_tree_feature",
    "minecraft:birch_sapling": "minecraft:birch_tree_feature",
    "minecraft:jungle_sapling": "minecraft:jungle_tree_feature",
    "minecraft:acacia_sapling": "minecraft:savanna_tree_feature",
    "minecraft:dark_oak_sapling": "minecraft:random_roofed_forest_feature",
    "minecraft:cherry_sapling": "minecraft:cherry_tree_feature"
};

// Listen for block placement
world.afterEvents.playerPlaceBlock.subscribe((event) => {
    const { block, dimension, player } = event;
    const typeId = block.typeId;

    // SCENARIO A: Instant crop growth
    if (typeId in CROP_MAX_STATES) {
        const maxGrowth = CROP_MAX_STATES[typeId];

        system.run(() => {
            try {
                const currentBlock = dimension.getBlock(block.location);

                if (!currentBlock || currentBlock.typeId !== typeId) return;

                const grownPermutation =
                    currentBlock.permutation.withState("growth", maxGrowth);

                currentBlock.setPermutation(grownPermutation);
            } catch (error) {
                player.sendMessage(
                    `§c[Crop Error] ${String(error)}`
                );
            }
        });
    }

    // SCENARIO B: Instant tree generation
    else if (typeId in TREE_FEATURES) {
        const featureName = TREE_FEATURES[typeId];

        const location = {
            x: block.location.x,
            y: block.location.y,
            z: block.location.z
        };

        // Tick 1: Verify the sapling and remove it
        system.run(() => {
            try {
                const currentBlock = dimension.getBlock(location);

                // Don't modify a block that has changed
                if (!currentBlock || currentBlock.typeId !== typeId) {
                    return;
                }

                currentBlock.setType("minecraft:air");

                // Tick 2: Generate the tree
                system.run(() => {
                    try {
                        const baseBlock = dimension.getBlock(location);

                        // Never overwrite another block
                        if (!baseBlock || baseBlock.typeId !== "minecraft:air") {
                            return;
                        }

                        // Use the native Script API feature placement
                        const success = dimension.placeFeature(
                            featureName,
                            location
                        );

                        // Restore sapling if generation failed
                        if (!success) {
                            const checkBlock = dimension.getBlock(location);

                            if (checkBlock?.typeId === "minecraft:air") {
                                checkBlock.setType(typeId);
                            }

                            player.sendMessage(
                                `§e[Tree] Generation failed. Sapling restored.`
                            );
                        }

                    } catch (error) {
                        // Restore only if the original position is still air
                        try {
                            const checkBlock = dimension.getBlock(location);

                            if (checkBlock?.typeId === "minecraft:air") {
                                checkBlock.setType(typeId);
                            }
                        } catch {
                            // Location may no longer be accessible
                        }

                        player.sendMessage(
                            `§c[Tree Error] §f${String(error)}`
                        );
                    }
                });

            } catch (error) {
                player.sendMessage(
                    `§c[Tree Error] §f${String(error)}`
                );
            }
        });
    }
});

