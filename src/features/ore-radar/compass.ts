
import type { Vector3 } from "@minecraft/server";

export interface RadarBearing {
    angle: number;
    direction: string;
    arrow: string;
}

const DIRECTIONS = [
    { name: "Front", arrow: "↑" },
    { name: "Front-Right", arrow: "↗" },
    { name: "Right", arrow: "→" },
    { name: "Back-Right", arrow: "↘" },
    { name: "Back", arrow: "↓" },
    { name: "Back-Left", arrow: "↙" },
    { name: "Left", arrow: "←" },
    { name: "Front-Left", arrow: "↖" }
];

export function calculateBearing(
    origin: Vector3,
    target: Vector3,
    playerYaw: number
): RadarBearing {

    const dx = target.x + 0.5 - origin.x;
    const dz = target.z + 0.5 - origin.z;

    const yaw = playerYaw * Math.PI / 180;

    // Minecraft yaw: 0 = south, 90 = west.
    const forwardX = -Math.sin(yaw);
    const forwardZ = Math.cos(yaw);

    const rightX = -Math.cos(yaw);
    const rightZ = -Math.sin(yaw);

    const forward = dx * forwardX + dz * forwardZ;
    const right = dx * rightX + dz * rightZ;

    const angle = Math.atan2(right, forward)
        * 180 / Math.PI;

    const normalizedAngle = (angle + 360) % 360;

    const index = Math.round(normalizedAngle / 45) % 8;

    const direction = DIRECTIONS[index];

    return {
        angle: normalizedAngle,
        direction: direction.name,
        arrow: direction.arrow
    };
}
