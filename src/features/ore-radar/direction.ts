
import type { Vector3 } from "@minecraft/server";

import type { CompassSector, RelativePosition } from "./types";

// Ordered clockwise from straight ahead of the player's view.
const SECTORS: readonly CompassSector[] = [
    "N",
    "NE",
    "E",
    "SE",
    "S",
    "SW",
    "W",
    "NW"
];

const CENTER_THRESHOLD = 1;

/**
 * Describes a target relative to the player's view. Sectors are measured
 * clockwise from the direction the player is facing: N is ahead, E is to the
 * right, S is behind and W is to the left.
 *
 * Minecraft yaw is 0 when facing south (+Z) and 90 when facing west (-X), so
 * the forward vector is (-sin(yaw), cos(yaw)) and the right vector is
 * (-cos(yaw), -sin(yaw)).
 */
export function getRelativePosition(
    origin: Vector3,
    viewYawDegrees: number,
    target: Vector3
): RelativePosition {
    const dx = target.x + 0.5 - origin.x;
    const dy = target.y + 0.5 - origin.y;
    const dz = target.z + 0.5 - origin.z;

    const horizontal = Math.sqrt(dx * dx + dz * dz);
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // Whole-block level difference: +4 means the ore is four block layers above the player's feet.
    const verticalOffset = target.y - Math.floor(origin.y);

    if (horizontal < CENTER_THRESHOLD) {
        return { sector: "CTR", distance, verticalOffset };
    }

    const yaw = viewYawDegrees * Math.PI / 180;

    const forwardX = -Math.sin(yaw);
    const forwardZ = Math.cos(yaw);

    const rightX = -Math.cos(yaw);
    const rightZ = -Math.sin(yaw);

    const forward = dx * forwardX + dz * forwardZ;
    const right = dx * rightX + dz * rightZ;

    const degrees = (Math.atan2(right, forward) * 180 / Math.PI + 360) % 360;
    const sector = SECTORS[Math.round(degrees / 45) % SECTORS.length];

    return { sector, distance, verticalOffset };
}
