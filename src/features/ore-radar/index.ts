
import { system, world } from "@minecraft/server";

import { RADAR_CONFIG } from "./config";
import { forgetPlayer, updateRadar } from "./detector";

export function initialize(): void {
    system.runInterval(() => {
        const tick = system.currentTick;

        for (const player of world.getPlayers()) {
            try {
                updateRadar(player, tick);
            } catch (error) {
                console.warn(
                    `[OreRadar] Update failed for ${player.name}: ${String(error)}`
                );
            }
        }
    }, RADAR_CONFIG.updateIntervalTicks);

    world.afterEvents.playerLeave.subscribe(event => {
        forgetPlayer(event.playerId);
    });

    console.warn("[OreRadar] Ore Sectors Radar initialized.");
}
