
import { CARDINALS, getCardinalIndex } from "./direction";
import type { CompassSector, RadarEntry, RadarView } from "./types";

const GRID_COLUMNS = 9;
const GRID_ROWS = 5;
const PLAYER_COLUMN = 4;
const PLAYER_ROW = 2;
const TAPE_HALF_WIDTH = 2;

const SECTOR_WORDS: Record<CompassSector, string> = {
    N: "ahead",
    NE: "ahead-right",
    E: "right",
    SE: "behind-right",
    S: "behind",
    SW: "behind-left",
    W: "left",
    NW: "ahead-left",
    CTR: "here"
};

function formatVerticalOffset(offset: number): string {
    if (offset > 0) return `§a+${offset}Y`;
    if (offset < 0) return `§c${offset}Y`;
    return "§7level";
}

function formatEntry(entry: RadarEntry): string {
    const { ore, blockCount, position } = entry;

    const count = blockCount > 1 ? ` §8x${blockCount}` : "";
    const distance = Math.round(position.distance);

    return (
        `  ${ore.color}§l${ore.name}§r${count} ` +
        `§f${distance}m §b${SECTOR_WORDS[position.sector]} ` +
        formatVerticalOffset(position.verticalOffset)
    );
}

/** Compass tape centered on the current heading, e.g. "W SW [S] SE E". */
function formatTape(facingDegrees: number): string {
    const center = getCardinalIndex(facingDegrees);
    const cells: string[] = [];

    for (let offset = -TAPE_HALF_WIDTH; offset <= TAPE_HALF_WIDTH; offset++) {
        const name = CARDINALS[(center + offset + CARDINALS.length) % CARDINALS.length];

        cells.push(offset === 0 ? `§e§l[${name}]§r` : `§7${name}`);
    }

    return cells.join("§8 · ");
}

/**
 * Top-down view with the player at the center and forward at the top. Each ore
 * is placed in its true direction, in a near, mid or far ring so that close
 * ores stay visible next to the player.
 */
function formatGrid(view: RadarView): string[] {
    const cells: string[][] = Array.from({ length: GRID_ROWS }, () =>
        Array.from({ length: GRID_COLUMNS }, () => "§8·")
    );

    cells[PLAYER_ROW][PLAYER_COLUMN] = "§e§l^";

    for (const entry of view.entries) {
        const { ahead, side } = entry.position;
        const horizontal = Math.hypot(ahead, side);

        if (horizontal < 0.5) continue;

        const ring = horizontal <= view.radius / 4 ? 1 : horizontal <= view.radius * 0.6 ? 2 : 3;

        const column = Math.min(
            GRID_COLUMNS - 1,
            Math.max(0, PLAYER_COLUMN + Math.round(side / horizontal * ring * 2))
        );
        const row = Math.min(
            GRID_ROWS - 1,
            Math.max(0, PLAYER_ROW - Math.round(ahead / horizontal * ring))
        );

        cells[row][column] = `${entry.ore.color}§l${entry.ore.symbol}`;
    }

    return cells.map(row => `    ${row.join(" ")}`);
}

/**
 * Renders the radar as the lines shown in the actionbar. The actionbar is the
 * only HUD text channel the Script API can update, so the layout is text only.
 */
export function formatRadar(view: RadarView): string {
    const lines: string[] = [
        `§8«« §a§lORE DETECTOR §8»» §7${view.status}`,
        `§eFACING §f${Math.round(view.facingDegrees)}° §8| ${formatTape(view.facingDegrees)}`,
        "",
        ...formatGrid(view),
        ""
    ];

    if (view.entries.length > 0) {
        for (const entry of view.entries) {
            lines.push(formatEntry(entry));
        }
    } else if (view.scanned) {
        lines.push("  §7No ores in range");
    } else {
        lines.push("  §7Scanning...");
    }

    const hidden = view.hiddenCount > 0 ? ` §8· +${view.hiddenCount} more` : "";

    lines.push(
        `§fDETECTED ${String(view.totalVeins).padStart(2, "0")}` +
        ` §8· §7radius ${view.radius}m${hidden}`
    );

    return lines.join("\n");
}
