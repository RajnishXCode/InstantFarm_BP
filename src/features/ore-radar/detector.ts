
import { EquipmentSlot, type Player } from "@minecraft/server";

import { ORE_DEFINITIONS, RADAR_CONFIG } from "./config";
import { getFacingDegrees, getRelativePosition } from "./direction";
import { formatRadar } from "./hud";
import { scanOres } from "./scanner";
import type { RadarEntry, RadarView, ScanReport } from "./types";

interface RadarSession {
    lastScanTick: number;
    report?: ScanReport;
    scanError?: string;
    lastText?: string;
    lastSentTick: number;
}

const sessions = new Map<string, RadarSession>();

export function isHoldingOreDetector(player: Player): boolean {
    const equippable = player.getComponent("minecraft:equippable");
    const mainHand = equippable?.getEquipment(EquipmentSlot.Mainhand);

    return mainHand?.typeId === RADAR_CONFIG.itemId;
}

function runScan(player: Player, session: RadarSession, tick: number): void {
    try {
        session.report = scanOres(player.dimension, player.location, tick);
        session.scanError = undefined;
    } catch (error) {
        session.scanError = error instanceof Error ? error.message : String(error);

        console.warn(`[OreRadar] Scan failed: ${session.scanError}`);
    }
}

function buildView(player: Player, session: RadarSession): RadarView {
    const report = session.report;
    const origin = player.location;
    const viewYaw = player.getRotation().y;

    // Distances and sectors are recalculated from the player's current pose,
    // so the display follows movement and rotation between scans.
    const entries: RadarEntry[] = (report?.veins ?? [])
        .map(vein => ({
            ore: ORE_DEFINITIONS[vein.typeId],
            blockCount: vein.blockCount,
            position: getRelativePosition(origin, viewYaw, vein.nearest)
        }))
        .sort((a, b) => a.position.distance - b.position.distance);

    const shown = entries.slice(0, RADAR_CONFIG.maxResults);

    let status = "SCANNING";

    if (session.scanError !== undefined) {
        status = "SCAN ERROR";
    } else if ((report?.unloadedChunks ?? 0) > 0) {
        status = "LOADING CHUNKS";
    }

    return {
        scanned: report !== undefined,
        status,
        facingDegrees: getFacingDegrees(viewYaw),
        radius: RADAR_CONFIG.scanRadius,
        totalVeins: entries.length,
        entries: shown,
        hiddenCount: entries.length - shown.length
    };
}

export function updateRadar(player: Player, tick: number): void {
    if (!isHoldingOreDetector(player)) {
        if (sessions.delete(player.id)) {
            player.onScreenDisplay.setActionBar("");
        }

        return;
    }

    let session = sessions.get(player.id);

    if (!session) {
        session = {
            lastScanTick: Number.NEGATIVE_INFINITY,
            lastSentTick: Number.NEGATIVE_INFINITY
        };

        sessions.set(player.id, session);
    }

    if (tick - session.lastScanTick >= RADAR_CONFIG.scanIntervalTicks) {
        session.lastScanTick = tick;

        runScan(player, session, tick);
    }

    const text = formatRadar(buildView(player, session));

    // Changed text is throttled so walking does not re-create the actionbar on
    // every small move. The actionbar fades a few seconds after its last update,
    // so unchanged text is re-sent periodically while the detector stays selected.
    const sinceSent = tick - session.lastSentTick;
    const changed = text !== session.lastText && sinceSent >= RADAR_CONFIG.displayMinIntervalTicks;
    const refreshDue = sinceSent >= RADAR_CONFIG.displayRefreshTicks;

    if (changed || refreshDue) {
        player.onScreenDisplay.setActionBar(text);

        session.lastText = text;
        session.lastSentTick = tick;
    }
}

export function forgetPlayer(playerId: string): void {
    sessions.delete(playerId);
}
