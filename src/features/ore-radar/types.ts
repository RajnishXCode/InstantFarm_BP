
import type { Vector3 } from "@minecraft/server";

export interface OreDefinition {
    readonly name: string;
    readonly symbol: string;
    readonly color: string;
}

export interface OreVein {
    readonly typeId: string;
    readonly nearest: Vector3;
    readonly blockCount: number;
}

export interface ScanReport {
    readonly veins: OreVein[];
    readonly unloadedChunks: number;
}

export type CompassSector =
    | "N"
    | "NE"
    | "E"
    | "SE"
    | "S"
    | "SW"
    | "W"
    | "NW"
    | "CTR";

export interface RelativePosition {
    readonly sector: CompassSector;
    readonly distance: number;
    readonly verticalOffset: number;
    // Horizontal offset in blocks: ahead is positive forward, side is positive to the right.
    readonly ahead: number;
    readonly side: number;
}

export interface RadarEntry {
    readonly ore: OreDefinition;
    readonly blockCount: number;
    readonly position: RelativePosition;
}

export interface RadarView {
    readonly scanned: boolean;
    readonly status: string;
    readonly facingDegrees: number;
    readonly radius: number;
    readonly totalVeins: number;
    readonly entries: RadarEntry[];
    readonly hiddenCount: number;
}
