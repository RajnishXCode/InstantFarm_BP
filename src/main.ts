import { world, system } from "@minecraft/server";

// Listen for any block being placed in the world
world.afterEvents.playerPlaceBlock.subscribe((event) => {
    const { block } = event;

    // List of crops we want to instantly grow
    const crops = [
        "minecraft:wheat", 
        "minecraft:carrots", 
        "minecraft:potatoes",
        "minecraft:beetroots",
        
    ];

    if (crops.includes(block.typeId)) {
        // Delay by 1 tick to safely modify the block state immediately after placement
        system.run(() => {
            // Find the maximum growth state for the crop (7 is max for wheat/carrots/potatoes)
            const fullyGrown = block.permutation.withState("growth", 7);
            
            // Apply the fully grown state to the block
            block.setPermutation(fullyGrown);
        });
    }
});