
import { registerFeature, initializeFeatures } from "./core/registry";

import { initialize as initializeCrops } from "./features/crops";
import { initialize as initializeTrees } from "./features/trees";

// Register existing features
registerFeature("Crops", initializeCrops);
registerFeature("Trees", initializeTrees);

// Start all registered features
initializeFeatures();

console.warn("[InstantFarm] Vanilla+ Enhancement Pack loaded successfully.");
