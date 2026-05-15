import { GAME_CONFIG } from "../config/gameConfig";

import type { Player } from "../types/player";
import type { Projectile } from "../types/projectile";

import type { Server } from "socket.io";

import { getPlayerStats } from "./getPlayerStats";

export function updateProjectiles(
    io: Server,
    players: Record<string, Player>,
    projectiles: Record<number, Projectile>
) {

    for (const id in projectiles) {
        const projectile = projectiles[id];

        projectile.x += projectile.velocity.x;
        projectile.y += projectile.velocity.y;

        // lifetime
        projectile.life--;

        if (projectile.life <= 0) {
            delete projectiles[id];
            continue;
        }

        // collision
        for (const playerId in players) {
            const player = players[playerId];

            if (playerId === projectile.ownerId) continue;
            if (!player.isAlive) continue;

            const prevX = projectile.x - projectile.velocity.x;

            const prevY = projectile.y - projectile.velocity.y;

            const dx = projectile.x - prevX;
            const dy = projectile.y - prevY;

            const t =
                (
                    (player.x - prevX) * dx +
                    (player.y - prevY) * dy
                ) /
                (dx * dx + dy * dy);

            const clampedT = Math.max(0, Math.min(1, t));

            const closestX = prevX + dx * clampedT;
            const closestY = prevY + dy * clampedT;

            const dist = Math.hypot(
                closestX - player.x,
                closestY - player.y
            );

            if (dist < projectile.radius + player.radius) {
                const attacker = players[projectile.ownerId];

                const attackerStats =
                    attacker
                        ? getPlayerStats(attacker)
                        : null;

                const damage = attackerStats
                    ? attackerStats.damage
                    : GAME_CONFIG.PROJECTILE.DAMAGE;

                // ============================================
                // Temporary Shield Immunity
                // ============================================

                const hasShield = player.shieldTimer > Date.now();

                if (!hasShield) player.health -= damage;

                // ============================================
                //  Shield impact
                // ============================================

                let effectX = closestX;
                let effectY = closestY;

                if (hasShield) {
                    // direction from player center → hit point
                    const hitDirX = closestX - player.x;
                    const hitDirY = closestY - player.y;

                    const length = Math.hypot(
                        hitDirX,
                        hitDirY
                    );

                    if (length > 0) {
                        const nx = hitDirX / length;
                        const ny = hitDirY / length;

                        // shield visual radius
                        const shieldRadius = player.radius + 14;

                        effectX = player.x + nx * shieldRadius;
                        effectY = player.y + ny * shieldRadius;
                    }
                }

                io.emit("hitEffect", {
                    x: effectX,
                    y: effectY,

                    type: hasShield
                        ? "shield"
                        : "normal",
                });

                player.health = Math.max(player.health, 0);
                (player as any).lastHitBy = projectile.ownerId;

                delete projectiles[id];

                break;
            }
        }

        // out of bounds
        if (
            projectile.x < 0 ||
            projectile.x > GAME_CONFIG.MAP.WIDTH ||
            projectile.y < 0 ||
            projectile.y > GAME_CONFIG.MAP.HEIGHT
        ) {
            delete projectiles[id];
        }
    }
}