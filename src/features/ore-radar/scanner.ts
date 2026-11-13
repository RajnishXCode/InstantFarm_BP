
import {
    BlockVolume,
    type Dimension,
    type Vector3
} from "@minecraft/server";

import {
    RADAR_CONFIG,
    ORE_BLOCKS,
    ORE_BLOCK_IDS
} from "./config";

export interface OreTarget {
    typeId: string;
    name: string;
    location: Vector3;
    distance: number;
}

export function scanNearbyOres(
    dimension: Dimension,
    origin: Vector3
): OreTarget[] {

    const radius = RADAR_CONFIG.radius;

    const center = {
        x: Math.floor(origin.x),
        y: Math.floor(origin.y),
        z: Math.floor(origin.z)
    };

    const minY = Math.max(
        center.y - radius,
        dimension.heightRange.min
    );
    const maxY = Math.min(
        center.y + radius,
        dimension.heightRange.max
    );

    if (minY > maxY) return [];

    const volume = new BlockVolume(
        {
            x: center.x - radius,
            y: minY,
            z: center.z - radius
        },
        {
            x: center.x + radius,
            y: maxY,
            z: center.z + radius
        }
    );

    const matchingBlocks = dimension.getBlocks(
        volume,
        {
            includeTypes: ORE_BLOCK_IDS,
            location: origin,
            closest: RADAR_CONFIG.scanCandidates
        },
        true
    );

    const targets: OreTarget[] = [];

    for (const location of matchingBlocks.getBlockLocationIterator()) {

        const dx = location.x + 0.5 - origin.x;
        const dy = location.y + 0.5 - origin.y;
        const dz = location.z + 0.5 - origin.z;

        const distance = Math.sqrt(
            dx * dx + dy * dy + dz * dz
        );

        if (distance > radius) continue;

        const block = dimension.getBlock(location);

        if (!block) continue;

        const name = ORE_BLOCKS[block.typeId];

        if (!name) continue;

        // Avoid displaying multiple blocks from the same vein.
        const belongsToExistingVein = targets.some(target => {

            if (target.typeId !== block.typeId) {
                return false;
            }

            const tx = target.location.x - location.x;
            const ty = target.location.y - location.y;
            const tz = target.location.z - location.z;

            const separation = Math.sqrt(
                tx * tx + ty * ty + tz * tz
            );

            return separation <= RADAR_CONFIG.veinSeparation;
        });

        if (belongsToExistingVein) continue;

        targets.push({
            typeId: block.typeId,
            name,
            location: { ...location },
            distance
        });

        if (targets.length >= RADAR_CONFIG.maxTargets) {
            break;
        }
    }

    return targets.sort(
        (a, b) => a.distance - b.distance
    );
}
