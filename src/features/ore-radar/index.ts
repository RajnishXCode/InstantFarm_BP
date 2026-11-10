
import {
    world,
    system,
    type Player,
    type EntityInventoryComponent
} from "@minecraft/server";

import { RADAR_CONFIG } from "./config";
import { scanNearbyOres } from "./scanner";
import { calculateBearing } from "./compass";

const ORE_DETECTOR_ID = "instantfarm:ore_detector";

const activePlayers = new Map<string, number>();

function isOreDetectorSelected(player: Player): boolean {
    try {
        const inventory = player.getComponent(
            "minecraft:inventory"
        ) as EntityInventoryComponent | undefined;

        if (!inventory?.container) return false;

        const selectedItem = inventory.container.getItem(
            player.selectedSlotIndex
        );

        return selectedItem?.typeId === ORE_DETECTOR_ID;
    } catch (error) {
        console.warn(
            `[OreRadar] Inventory check failed: ${String(error)}`
        );
        return false;
    }
}

function displayRadar(player: Player): void {
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
    system.runInterval(() => {
        const players = world.getPlayers();

        const onlineIds = new Set(
            players.map(player => player.id)
        );

        // Remove disconnected players.
        for (const playerId of activePlayers.keys()) {
            if (!onlineIds.has(playerId)) {
                activePlayers.delete(playerId);
            }
        }

        for (const player of players) {
            const detectorSelected = isOreDetectorSelected(player);
            const wasActive = activePlayers.has(player.id);

            // Detector was selected.
            if (detectorSelected && !wasActive) {
                activePlayers.set(
                    player.id,
                    system.currentTick - RADAR_CONFIG.scanIntervalTicks
                );

                player.sendMessage("§a[Ore Radar] Radar activated.");
            }

            // Player switched to another item.
            if (!detectorSelected && wasActive) {
                activePlayers.delete(player.id);

                player.onScreenDisplay.setActionBar("");

                player.sendMessage("§7[Ore Radar] Radar deactivated.");
                continue;
            }

            if (!detectorSelected) continue;

            const lastScan = activePlayers.get(player.id)!;

            if (
                system.currentTick - lastScan <
                RADAR_CONFIG.scanIntervalTicks
            ) {
                continue;
            }

            activePlayers.set(player.id, system.currentTick);

            try {
                displayRadar(player);
            } catch (error) {
                console.warn(
                    `[OreRadar] Scan failed: ${String(error)}`
                );
            }
        }
    }, 5);

    console.warn("[OreRadar] Held-item controller initialized.");
}
