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

interface BlockCandidate {
    location: Vector3;
    distance: number;
}

function distanceFromOrigin(location: Vector3, origin: Vector3): number {
    const dx = location.x + 0.5 - origin.x;
    const dy = location.y + 0.5 - origin.y;
    const dz = location.z + 0.5 - origin.z;

    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function findOreCandidates(
    dimension: Dimension,
    origin: Vector3,
    center: Vector3,
    minY: number,
    maxY: number
): BlockCandidate[] {
    const radius = RADAR_CONFIG.radius;
    const chunkSize = RADAR_CONFIG.queryChunkSize;
    const candidates: BlockCandidate[] = [];

    const minX = center.x - radius;
    const maxX = center.x + radius;
    const minZ = center.z - radius;
    const maxZ = center.z + radius;

    // Small queries avoid oversized BlockVolume errors and engine-specific
    // closest-query limitations. Results are sorted globally below.
    for (let fromX = minX; fromX <= maxX; fromX += chunkSize) {
        for (let fromY = minY; fromY <= maxY; fromY += chunkSize) {
            for (let fromZ = minZ; fromZ <= maxZ; fromZ += chunkSize) {
                const volume = new BlockVolume(
                    { x: fromX, y: fromY, z: fromZ },
                    {
                        x: Math.min(fromX + chunkSize - 1, maxX),
                        y: Math.min(fromY + chunkSize - 1, maxY),
                        z: Math.min(fromZ + chunkSize - 1, maxZ)
                    }
                );

                const matchingBlocks = dimension.getBlocks(
                    volume,
                    { includeTypes: ORE_BLOCK_IDS },
                    true
                );

                for (const location of matchingBlocks.getBlockLocationIterator()) {
                    const distance = distanceFromOrigin(location, origin);

                    if (distance <= radius) {
                        candidates.push({
                            location: { ...location },
                            distance
                        });
                    }
                }
            }
        }
    }

    return candidates.sort((a, b) => a.distance - b.distance);
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

    const candidates = findOreCandidates(
        dimension,
        origin,
        center,
        minY,
        maxY
    );

    const targets: OreTarget[] = [];

    for (const candidate of candidates.slice(0, RADAR_CONFIG.scanCandidates)) {
        const block = dimension.getBlock(candidate.location);
        if (!block) continue;

        const name = ORE_BLOCKS[block.typeId];
        if (!name) continue;

        // Avoid displaying multiple blocks from the same ore vein.
        const belongsToExistingVein = targets.some(target => {
            if (target.typeId !== block.typeId) return false;

            const dx = target.location.x - candidate.location.x;
            const dy = target.location.y - candidate.location.y;
            const dz = target.location.z - candidate.location.z;

            return Math.sqrt(dx * dx + dy * dy + dz * dz) <=
                RADAR_CONFIG.veinSeparation;
        });

        if (belongsToExistingVein) continue;

        targets.push({
            typeId: block.typeId,
            name,
            location: candidate.location,
            distance: candidate.distance
        });

        if (targets.length >= RADAR_CONFIG.maxTargets) break;
    }

    return targets;
}
