
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

                // Stems only produce their fruit on a random tick, so do it
                // immediately here. Place the fruit on one adjacent air block
                // that sits on valid soil.
                if (typeId === "minecraft:melon_stem" ||
                    typeId === "minecraft:pumpkin_stem") {
                    const fruitId =
                        typeId === "minecraft:melon_stem"
                            ? "minecraft:melon_block"
                            : "minecraft:pumpkin";

                    const validSoil = new Set([
                        "minecraft:grass",
                        "minecraft:dirt",
                        "minecraft:coarse_dirt",
                        "minecraft:podzol",
                        "minecraft:mycelium",
                        "minecraft:farmland",
                        "minecraft:dirt_with_roots"
                    ]);

                    const offsets = [
                        { x: 1, z: 0 },
                        { x: -1, z: 0 },
                        { x: 0, z: 1 },
                        { x: 0, z: -1 }
                    ];

                    for (const offset of offsets) {
                        const fruitLocation = {
                            x: location.x + offset.x,
                            y: location.y,
                            z: location.z + offset.z
                        };

                        const airBlock = dimension.getBlock(fruitLocation);

                        if (!airBlock ||
                            airBlock.typeId !== "minecraft:air") {
                            continue;
                        }

                        const soilBlock = dimension.getBlock({
                            x: fruitLocation.x,
                            y: fruitLocation.y - 1,
                            z: fruitLocation.z
                        });

                        if (!soilBlock ||
                            !validSoil.has(soilBlock.typeId)) {
                            continue;
                        }

                        airBlock.setType(fruitId);
                        break;
                    }
                }

            } catch (error) {
                console.warn(
                    `[InstantFarm:Crops] ${String(error)}`
                );
            }
        });
    });

}
