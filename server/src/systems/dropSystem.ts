import type { Server } from "socket.io";

import { GAME_CONFIG } from "../config/gameConfig";

import type { Drop } from "../types/drop";
import type { Player } from "../types/player";


export function spawnDrops(
    drops: Record<number, Drop>,

    dropIdRef: {
        current: number;
    }
) {
    const current = Object.keys(drops).length;

    if (current >= GAME_CONFIG.DROP.MAX_COUNT) return;

    const missing = GAME_CONFIG.DROP.MAX_COUNT - current;

    for (let i = 0; i < missing; i++) {
        const randomType =
            Math.random() > 0.5
                ? "health"
                : "shield";

        drops[dropIdRef.current] = {
            id: dropIdRef.current,
            x: Math.random() * GAME_CONFIG.MAP.WIDTH,
            y: Math.random() * GAME_CONFIG.MAP.HEIGHT,
            type: randomType,
        };

        dropIdRef.current++;
    }
}

export function handleDropPickups(
    io: Server,
    players: Record<string, Player>,
    drops: Record<number, Drop>
) {
    for (const playerId in players) {
        const player = players[playerId];

        if (!player.isAlive) continue;

        for (const id in drops) {
            const drop = drops[id];

            const dist = Math.hypot(
                player.x - drop.x,
                player.y - drop.y
            );

            // pickup range
            if (dist < player.radius + 20) {

                // ============================================
                // Health Drop
                // ============================================

                if (drop.type === "health") {
                    if (
                        player.health >=
                        GAME_CONFIG.PLAYER.MAX_HEALTH
                    ) {
                        continue;
                    }

                    player.health = Math.min(
                        GAME_CONFIG.PLAYER.MAX_HEALTH,
                        player.health + 50
                    );
                }

                // ============================================
                // Shield Drop
                // ============================================

                if (drop.type === "shield") {
                    if (player.shieldTimer > Date.now()) {
                        continue;
                    }

                    player.shieldTimer =
                        Date.now() + GAME_CONFIG.DROP.SHIELD_DURATION
                }

                delete drops[id];

                io.emit("updateDrops", drops);
            }
        }
    }
}