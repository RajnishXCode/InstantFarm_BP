
import { world, system } from "@minecraft/server";

export function initialize(): void {

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

    world.afterEvents.playerPlaceBlock.subscribe((event) => {

        const { block, dimension } = event;
        const typeId = block.typeId;

        if (!(typeId in CROP_MAX_STATES)) return;

        const maxGrowth = CROP_MAX_STATES[typeId];

        const location = { ...block.location };

        system.run(() => {
            try {
                const currentBlock = dimension.getBlock(location);

                if (!currentBlock || currentBlock.typeId !== typeId) {
                    return;
                }

                const grownPermutation =
                    currentBlock.permutation.withState(
                        "growth",
                        maxGrowth
                    );

                currentBlock.setPermutation(grownPermutation);

            } catch (error) {
                console.warn(
                    `[InstantFarm:Crops] ${String(error)}`
                );
            }
        });
    });

}
