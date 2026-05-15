import { GAME_CONFIG } from "../config/gameConfig";

import type { Player } from "../types/player";
import type { Projectile } from "../types/projectile";

import { getPlayerStats, } from "./getPlayerStats";

export function handleShooting(
    players: Record<string, Player>,
    projectiles: Record<number, Projectile>,
    projectileIdRef: {
        current: number;
    }
) {
    for (const playerId in players) {
        const player = players[playerId];
        const stats = getPlayerStats(player);

        if (!player.isAlive) continue;
        if (player.dxShoot === 0 && player.dyShoot === 0) continue;

        player.shotTick++;

        if (player.shotTick < stats.fireRate) continue;

        player.shotTick = 0;

        const NOSE_OFFSET = player.radius;

        projectiles[projectileIdRef.current] = {
            id: projectileIdRef.current,
            x: player.x + Math.cos(player.angle) * NOSE_OFFSET,
            y: player.y + Math.sin(player.angle) * NOSE_OFFSET,
            radius: GAME_CONFIG.PROJECTILE.RADIUS,
            velocity: {
                x: Math.cos(player.angle) * GAME_CONFIG.PROJECTILE.SPEED,
                y: Math.sin(player.angle) * GAME_CONFIG.PROJECTILE.SPEED,
            },
            ownerId: playerId,
            life: Math.floor(
                GAME_CONFIG.PROJECTILE.RANGE / GAME_CONFIG.PROJECTILE.SPEED
            ),
            angle: player.angle,
        };

        projectileIdRef.current++;
    }
}