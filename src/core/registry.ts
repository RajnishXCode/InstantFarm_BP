
export type FeatureInitializer = () => void;

interface Feature {
    name: string;
    initialize: FeatureInitializer;
}

const features: Feature[] = [];

export function registerFeature(
    name: string,
    initialize: FeatureInitializer
): void {
    if (features.some(feature => feature.name === name)) {
        throw new Error(`Feature already registered: ${name}`);
    }

    features.push({ name, initialize });
}

export function initializeFeatures(): void {
    for (const feature of features) {
        try {
            feature.initialize();

            console.warn(
                `[InstantFarm] Feature initialized: ${feature.name}`
            );
        } catch (error) {
            console.error(
                `[InstantFarm] Failed to initialize ${feature.name}: ${String(error)}`
            );
        }
    }
}
