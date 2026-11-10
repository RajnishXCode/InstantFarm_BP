
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
    } catch {
        return false;
    }
}

// function displayRadar(player: Player): void {
//     const targets = scanNearbyOres(
//         player.dimension,
//         player.location
//     );

//     const yaw = player.getRotation().y;

//     // const compass = calculateBearing(
//     //     player.location,
//     //     {
//     //         x: player.location.x,
//     //         y: player.location.y,
//     //         z: player.location.z + 10
//     //     },
//     //     yaw
//     // );

//     const header = "§a◉ ORE RADAR §8| §7SCANNING";

//     if (targets.length === 0) {
//         player.onScreenDisplay.setActionBar(
//             `${header}\n§7No ores detected within ${RADAR_CONFIG.radius} blocks`
//         );
//         return;
//     }

//     const results = targets.map(target => {
//         const bearing = calculateBearing(
//             player.location,
//             target.location,
//             yaw
//         );

//         const distance = Math.round(target.distance);

//         return `§e${bearing.arrow} §f${target.name} §b${distance} blocks §7(${bearing.direction})`;
//     });

//     player.onScreenDisplay.setActionBar(
//         `${header}\n${results.join("\n")}`
//     );
// }


function displayRadar(player: Player): void {
    const targets = scanNearbyOres(
        player.dimension,
        player.location
    );

    const yaw = player.getRotation().y;

    const header = "§a◉ ORE RADAR §8| §7SCANNING";

    if (targets.length === 0) {
        player.onScreenDisplay.setActionBar(
            `${header}\n§7No ores detected nearby`
        );
        return;
    }

    const results = targets.map(target => {
        const bearing = calculateBearing(
            player.location,
            target.location,
            yaw
        );

        return (
            `§e${bearing.arrow} ` +
            `§f${target.name} ` +
            `§b${Math.round(target.distance)} blocks`
        );
    });

    player.onScreenDisplay.setActionBar(
        `${header}\n${results.join("\n")}`
    );
}


export function initialize(): void {
    system.runInterval(() => {
        const players = world.getPlayers();

        const onlineIds = new Set(
            players.map(player => player.id)
        );

        for (const playerId of activePlayers.keys()) {
            if (!onlineIds.has(playerId)) {
                activePlayers.delete(playerId);
            }
        }

        for (const player of players) {
            const selected = isOreDetectorSelected(player);
            const wasActive = activePlayers.has(player.id);

            if (selected && !wasActive) {
                activePlayers.set(
                    player.id,
                    system.currentTick - RADAR_CONFIG.scanIntervalTicks
                );

                player.sendMessage(
                    "§a[Ore Radar] Detector connected."
                );
            }

            if (!selected && wasActive) {
                activePlayers.delete(player.id);

                player.onScreenDisplay.setActionBar("");

                player.sendMessage(
                    "§7[Ore Radar] Detector disconnected."
                );

                continue;
            }

            if (!selected) continue;

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
    }, 5);

    console.warn("[OreRadar] Live radar initialized.");
}
