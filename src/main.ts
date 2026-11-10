
import {
    registerFeature,
    initializeFeatures
} from "./core/registry";

import { initialize as initializeCrops } from "./features/crops";
import { initialize as initializeTrees } from "./features/trees";
import { initialize as initializeOreRadar } from "./features/ore-radar";

registerFeature("Crops", initializeCrops);
registerFeature("Trees", initializeTrees);
registerFeature("OreRadar", initializeOreRadar);

initializeFeatures();

console.warn(
    "[InstantFarm] Vanilla+ Enhancement Pack loaded successfully."
);
