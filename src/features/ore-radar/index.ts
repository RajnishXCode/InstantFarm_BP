
import {
    world,
    system,
    type Player
} from "@minecraft/server";

import { RADAR_CONFIG } from "./config";
import { scanNearbyOres } from "./scanner";
import { calculateBearing } from "./compass";

const ORE_DETECTOR_ID = "instantfarm:ore_detector";

const activePlayers = new Map<string, number>();

function displayRadar(
    player: Player
): void {

    const targets = scanNearbyOres(
        player.dimension,
        player.location
    );

    if (targets.length === 0) {
        player.onScreenDisplay.setActionBar(
            "§aORE RADAR §7| §8No ores detected nearby"
        );
        return;
    }

    const yaw = player.getRotation().y;

    const results = targets.map(target => {

        const bearing = calculateBearing(
            player.location,
            target.location,
            yaw
        );

        const distance = Math.round(target.distance);

        return `§f${target.name} §b${distance}m §e${bearing.arrow}`;
    });

    player.onScreenDisplay.setActionBar(
        `§aORE RADAR §7| ${results.join(" §8• ")}`
    );
}

export function initialize(): void {

    // Activate or deactivate the radar using the Ore Detector.
    world.afterEvents.itemUse.subscribe(event => {

        const player = event.source;

        if (player.typeId !== "minecraft:player") return;

        if (event.itemStack.typeId !== ORE_DETECTOR_ID) {
            return;
        }

        const playerEntity = player as Player;

        if (activePlayers.has(playerEntity.id)) {

            activePlayers.delete(playerEntity.id);

            playerEntity.onScreenDisplay.setActionBar("");

            playerEntity.sendMessage(
                "§7[Ore Radar] Radar deactivated."
            );

            return;
        }

        activePlayers.set(
            playerEntity.id,
            -RADAR_CONFIG.scanIntervalTicks
        );

        playerEntity.sendMessage(
            "§a[Ore Radar] Radar activated."
        );
    });

    // Check active players every 10 ticks.
    system.runInterval(() => {

        const players = world.getPlayers();

        const onlineIds = new Set(
            players.map(player => player.id)
        );

        // Remove players who have left the world.
        for (const playerId of activePlayers.keys()) {
            if (!onlineIds.has(playerId)) {
                activePlayers.delete(playerId);
            }
        }

        for (const player of players) {

            if (!activePlayers.has(player.id)) {
                continue;
            }

            const lastScan = activePlayers.get(player.id)!;

            if (
                system.currentTick - lastScan <
                RADAR_CONFIG.scanIntervalTicks
            ) {
                continue;
            }

            activePlayers.set(
                player.id,
                system.currentTick
            );

            try {
                displayRadar(player);
            } catch (error) {
                console.warn(
                    `[OreRadar] Scan failed: ${String(error)}`
                );
            }
        }

    }, 10);

    console.warn("[OreRadar] Feature initialized.");
}
