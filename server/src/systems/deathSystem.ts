import { GAME_CONFIG } from "../config/gameConfig";

import type { Server } from "socket.io";
import type { Player } from "../types/player";
import type { Collectible } from "../types/collectible";

export function handleDeaths(
    io: Server,
    players: Record<string, Player>,
    collectibles: Record<number, Collectible>,
    collectibleIdRef: { current: number; }
) {

    for (const playerId in players) {

        const player = players[playerId];

        if (player.health <= 0 && player.isAlive) {

            player.isAlive = false;

            io.to(playerId).emit("playerDead");

            player.health = 0;

            const killerId = (player as any).lastHitBy;

            if (killerId && players[killerId]) {
                players[killerId].score += 10;
                players[killerId].coins += 10;
            }

            const DROP_COUNT = GAME_CONFIG.COLLECTIBLE.DROP_COUNT;

            for (let i = 0; i < DROP_COUNT; i++) {

                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * 30;

                const x = player.x + Math.cos(angle) * distance;
                const y = player.y + Math.sin(angle) * distance;

                collectibles[collectibleIdRef.current] = {
                    id: collectibleIdRef.current,

                    x,
                    y,

                    value: 1,

                    size:
                        GAME_CONFIG.COLLECTIBLE.SIZE_MIN +
                        Math.random() *
                        (
                            GAME_CONFIG.COLLECTIBLE.SIZE_MAX -
                            GAME_CONFIG.COLLECTIBLE.SIZE_MIN
                        ),

                    color:
                        GAME_CONFIG.COLLECTIBLE.COLORS[
                        Math.floor(
                            Math.random() *
                            GAME_CONFIG.COLLECTIBLE.COLORS.length
                        )
                        ],
                };

                collectibleIdRef.current++;
            }
        }
    }
}