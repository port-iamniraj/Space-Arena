import type { Player } from "../types/player";
import type { Collectible } from "../types/collectible";

import { GAME_CONFIG } from "../config/gameConfig";

export function spawnCollectibles(
    collectibles: Record<number, Collectible>,

    collectibleIdRef: {
        current: number;
    }
) {
    const TARGET_COLLECTIBLES = GAME_CONFIG.COLLECTIBLE.TARGET_COUNT;

    const current = Object.keys(collectibles).length;

    const missing = TARGET_COLLECTIBLES - current;

    if (missing <= 0) return;

    for (let i = 0; i < missing; i++) {
        const x = Math.random() * GAME_CONFIG.MAP.WIDTH;
        const y = Math.random() * GAME_CONFIG.MAP.HEIGHT;

        collectibles[collectibleIdRef.current] = {
            id: collectibleIdRef.current,
            x,
            y,
            value: 1,
            size: 3 + Math.random() * 3,
            color: ["#fde047", "#f87171", "#60a5fa", "#34d399"][Math.floor(Math.random() * 4)],
        };

        collectibleIdRef.current++;
    }
}

export function handleCollectibles(
    players: Record<string, Player>,
    collectibles: Record<number, Collectible>
) {
    for (const playerId in players) {
        const player = players[playerId];

        if (!player.isAlive) continue;

        for (const id in collectibles) {
            const c = collectibles[id];

            const dist = Math.hypot(
                player.x - c.x,
                player.y - c.y
            );

            if (dist < player.radius + 5) {
                player.score += c.value;
                player.coins += c.value;
                delete collectibles[id];
            }
        }
    }
}