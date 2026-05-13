import { GAME_CONFIG } from "../config/gameConfig";

import type { Player } from "../types/player";

import { getPlayerStats } from "./getPlayerStats";

export function playerMovement(players: Record<string, Player>) {
    for (const playerId in players) {
        const player = players[playerId];
        const stats = getPlayerStats(player);

        if (!player.isAlive) continue;

        player.x += player.dx * stats.speed;
        player.y += player.dy * stats.speed;

        const r = player.radius;

        player.x = Math.max(r, Math.min(GAME_CONFIG.MAP.WIDTH - r, player.x));
        player.y = Math.max(r, Math.min(GAME_CONFIG.MAP.HEIGHT - r, player.y));
    }
}