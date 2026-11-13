
import { world, system } from "@minecraft/server";

const TREE_FEATURES: Record<string, string> = {
    "minecraft:oak_sapling": "minecraft:oak_tree_feature",
    "minecraft:spruce_sapling": "minecraft:select_spruce_tree_feature",
    "minecraft:birch_sapling": "minecraft:birch_tree_feature",
    "minecraft:jungle_sapling": "minecraft:jungle_tree_feature",
    "minecraft:acacia_sapling": "minecraft:savanna_tree_feature",
    "minecraft:dark_oak_sapling": "minecraft:random_roofed_forest_feature",
    "minecraft:cherry_sapling": "minecraft:cherry_tree_feature",
    "minecraft:mangrove_propagule": "minecraft:mangrove_tree_feature",
    "minecraft:pale_oak_sapling": "minecraft:pale_oak_tree_feature",
    "minecraft:poplar_sapling": "minecraft:poplar_tree_feature"
};

export function initialize(): void {

    world.afterEvents.playerPlaceBlock.subscribe((event) => {

        const { block, dimension, player } = event;
        const typeId = block.typeId;

        if (!(typeId in TREE_FEATURES)) return;

        const featureName = TREE_FEATURES[typeId];

        const location = {
            x: block.location.x,
            y: block.location.y,
            z: block.location.z
        };

        // Tick 1: Remove the sapling
        system.run(() => {
            try {
                const currentBlock = dimension.getBlock(location);

                if (!currentBlock || currentBlock.typeId !== typeId) {
                    return;
                }

                currentBlock.setType("minecraft:air");

                // Tick 2: Generate the tree
                system.run(() => {
                    try {
                        const baseBlock = dimension.getBlock(location);

                        if (!baseBlock ||
                            baseBlock.typeId !== "minecraft:air") {
                            return;
                        }

                        const success = dimension.placeFeature(
                            featureName,
                            location
                        );

                        if (!success) {
                            const checkBlock = dimension.getBlock(location);

                            if (checkBlock?.typeId === "minecraft:air") {
                                checkBlock.setType(typeId);
                            }

                            player.sendMessage(
                                "§e[InstantFarm] Tree generation failed. Sapling restored."
                            );
                        }

                    } catch (error) {
                        try {
                            const checkBlock = dimension.getBlock(location);

                            if (checkBlock?.typeId === "minecraft:air") {
                                checkBlock.setType(typeId);
                            }
                        } catch {
                            // Chunk or location unavailable
                        }

                        player.sendMessage(
                            `§c[InstantFarm:Trees] ${String(error)}`
                        );
                    }
                });

            } catch (error) {
                player.sendMessage(
                    `§c[InstantFarm:Trees] ${String(error)}`
                );
            }
        });
    });

}
