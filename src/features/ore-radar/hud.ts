
import type { RadarEntry, RadarView } from "./types";

function formatVerticalOffset(offset: number): string {
    if (offset > 0) return `§a+${offset}Y`;
    if (offset < 0) return `§c${offset}Y`;
    return "§7=Y";
}

function formatEntry(entry: RadarEntry): string {
    const { ore, blockCount, position } = entry;

    const count = blockCount > 1 ? ` §8x${blockCount}` : "";
    const distance = Math.round(position.distance);

    return (
        `${ore.color}${ore.name}${count} ` +
        `§f${distance}m §b${position.sector} ` +
        formatVerticalOffset(position.verticalOffset)
    );
}

/**
 * Renders the radar as the lines shown in the actionbar. The actionbar is the
 * only HUD text channel the Script API can update, so the layout is text only.
 */
export function formatRadar(view: RadarView): string {
    const detected = String(view.totalVeins).padStart(2, "0");

    const lines: string[] = [
        `§a§lORE DETECTOR §r§8| §fDETECTED: ${detected} §8| §7${view.status}`,
        `§8Radius ${view.radius}m  N=ahead E=right S=behind W=left`
    ];

    if (view.entries.length > 0) {
        for (const entry of view.entries) {
            lines.push(formatEntry(entry));
        }
    } else if (view.scanned) {
        lines.push("§7No ores in range");
    } else {
        lines.push("§7Scanning...");
    }

    if (view.hiddenCount > 0) {
        lines.push(`§8+${view.hiddenCount} more`);
    }

    return lines.join("\n");
}
