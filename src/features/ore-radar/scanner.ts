
import {
    BlockVolume,
    type Dimension,
    type Vector3
} from "@minecraft/server";

import {
    ORE_BLOCK_IDS,
    ORE_DEFINITIONS,
    RADAR_CONFIG
} from "./config";

import type { OreVein, ScanReport } from "./types";

interface ChunkEntry {
    readonly scannedTick: number;
    readonly positions: Vector3[];
}

interface Candidate {
    readonly location: Vector3;
    readonly distance: number;
}

interface VerifiedBlock {
    readonly typeId: string;
    readonly location: Vector3;
}

interface VeinBuilder {
    readonly typeId: string;
    readonly nearest: Vector3;
    readonly members: Vector3[];
}

const chunkCache = new Map<string, ChunkEntry>();

function distanceToBlockCenter(origin: Vector3, location: Vector3): number {
    const dx = location.x + 0.5 - origin.x;
    const dy = location.y + 0.5 - origin.y;
    const dz = location.z + 0.5 - origin.z;

    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function squaredDistance(a: Vector3, b: Vector3): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;

    return dx * dx + dy * dy + dz * dz;
}

function chunkIntersectsRadius(
    origin: Vector3,
    cx: number,
    cy: number,
    cz: number
): boolean {
    const size = RADAR_CONFIG.chunkSize;
    const radius = RADAR_CONFIG.scanRadius;

    const nearestX = Math.min(Math.max(origin.x, cx * size), cx * size + size);
    const nearestY = Math.min(Math.max(origin.y, cy * size), cy * size + size);
    const nearestZ = Math.min(Math.max(origin.z, cz * size), cz * size + size);

    return squaredDistance(origin, {
        x: nearestX,
        y: nearestY,
        z: nearestZ
    }) <= radius * radius;
}

function pruneChunkCache(tick: number): void {
    if (chunkCache.size <= RADAR_CONFIG.chunkCachePruneSize) return;

    for (const [key, entry] of chunkCache) {
        if (tick - entry.scannedTick >= RADAR_CONFIG.chunkCacheTicks) {
            chunkCache.delete(key);
        }
    }
}

/**
 * Returns every ore block position inside one 16x16x16 chunk, or undefined
 * when the chunk is not loaded. Results are cached per chunk for a short
 * time so the same chunk is not re-queried on every scan.
 */
function getChunkOrePositions(
    dimension: Dimension,
    cx: number,
    cy: number,
    cz: number,
    tick: number
): Vector3[] | undefined {
    const size = RADAR_CONFIG.chunkSize;
    const key = `${dimension.id}|${cx}|${cy}|${cz}`;

    const cached = chunkCache.get(key);

    if (cached && tick - cached.scannedTick < RADAR_CONFIG.chunkCacheTicks) {
        return cached.positions;
    }

    const { min, max } = dimension.heightRange;

    const minX = cx * size;
    const minZ = cz * size;
    const minY = Math.max(cy * size, min);
    const maxY = Math.min(cy * size + size - 1, max);

    if (minY > maxY) return [];

    // getBlock returns undefined for blocks in unloaded chunks. Probing one
    // block avoids a throwing block query and leaves the chunk uncached, so
    // it is retried on a later scan.
    if (dimension.getBlock({ x: minX, y: minY, z: minZ }) === undefined) {
        return undefined;
    }

    const volume = new BlockVolume(
        { x: minX, y: minY, z: minZ },
        { x: minX + size - 1, y: maxY, z: minZ + size - 1 }
    );

    const matches = dimension.getBlocks(
        volume,
        { includeTypes: ORE_BLOCK_IDS },
        true
    );

    const positions: Vector3[] = [];

    for (const location of matches.getBlockLocationIterator()) {
        positions.push({ x: location.x, y: location.y, z: location.z });
    }

    chunkCache.set(key, { scannedTick: tick, positions });
    pruneChunkCache(tick);

    return positions;
}

function groupIntoVeins(blocks: VerifiedBlock[]): OreVein[] {
    const linkSquared = RADAR_CONFIG.veinLinkDistance ** 2;
    const builders: VeinBuilder[] = [];

    // Blocks arrive nearest-first, so each vein's first member is its nearest block.
    for (const block of blocks) {
        const vein = builders.find(builder =>
            builder.typeId === block.typeId &&
            builder.members.some(member =>
                squaredDistance(member, block.location) <= linkSquared
            )
        );

        if (vein) {
            vein.members.push(block.location);
        } else {
            builders.push({
                typeId: block.typeId,
                nearest: block.location,
                members: [block.location]
            });
        }
    }

    return builders.map(builder => ({
        typeId: builder.typeId,
        nearest: builder.nearest,
        blockCount: builder.members.length
    }));
}

export function scanOres(
    dimension: Dimension,
    origin: Vector3,
    tick: number
): ScanReport {
    const size = RADAR_CONFIG.chunkSize;
    const radius = RADAR_CONFIG.scanRadius;
    const heightRange = dimension.heightRange;

    const minCx = Math.floor((origin.x - radius) / size);
    const maxCx = Math.floor((origin.x + radius) / size);
    const minCy = Math.floor(Math.max(origin.y - radius, heightRange.min) / size);
    const maxCy = Math.floor(Math.min(origin.y + radius, heightRange.max) / size);
    const minCz = Math.floor((origin.z - radius) / size);
    const maxCz = Math.floor((origin.z + radius) / size);

    let unloadedChunks = 0;
    const candidates: Candidate[] = [];

    for (let cx = minCx; cx <= maxCx; cx++) {
        for (let cy = minCy; cy <= maxCy; cy++) {
            for (let cz = minCz; cz <= maxCz; cz++) {
                if (!chunkIntersectsRadius(origin, cx, cy, cz)) continue;

                const positions = getChunkOrePositions(dimension, cx, cy, cz, tick);

                if (!positions) {
                    unloadedChunks++;
                    continue;
                }

                for (const location of positions) {
                    const distance = distanceToBlockCenter(origin, location);

                    if (distance <= radius) {
                        candidates.push({ location, distance });
                    }
                }
            }
        }
    }

    candidates.sort((a, b) => a.distance - b.distance);

    // Cached positions can be stale (mined ore), so each candidate is
    // re-read from the world before it is shown.
    const verified: VerifiedBlock[] = [];

    for (const candidate of candidates.slice(0, RADAR_CONFIG.maxVerifiedBlocks)) {
        const block = dimension.getBlock(candidate.location);

        if (!block || !(block.typeId in ORE_DEFINITIONS)) continue;

        verified.push({ typeId: block.typeId, location: candidate.location });
    }

    return {
        veins: groupIntoVeins(verified),
        unloadedChunks
    };
}
