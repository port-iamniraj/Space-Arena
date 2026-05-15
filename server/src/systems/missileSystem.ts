import { GAME_CONFIG } from "../config/gameConfig";

import type { Player } from "../types/player";
import type { Missile } from "../types/missile";

import { findNearestTarget } from "./findNearestTarget";

import type { Server } from "socket.io";

export function spawnMissiles(
    players: Record<string, Player>,
    missiles: Record<number, Missile>,
    missileIdRef: { current: number; }
) {

    for (const playerId in players) {

        const player = players[playerId];

        if (!player.isAlive) continue;

        if (!player.upgrades.missile) continue;

        const alreadyHasMissile =
            Object.values(missiles).some(
                (m) => m.ownerId === playerId
            );

        if (alreadyHasMissile) continue;

        missiles[missileIdRef.current] = {
            id: missileIdRef.current,

            x:
                player.x +
                Math.cos(player.angle) *
                player.radius,

            y:
                player.y +
                Math.sin(player.angle) *
                player.radius,

            velocity: {
                x:
                    Math.cos(player.angle) *
                    GAME_CONFIG.MISSILE.SPEED,

                y:
                    Math.sin(player.angle) *
                    GAME_CONFIG.MISSILE.SPEED,
            },

            angle: player.angle,

            ownerId: playerId,

            life: Math.floor(
                GAME_CONFIG.MISSILE.RANGE /
                GAME_CONFIG.MISSILE.SPEED
            ),

            targetId: findNearestTarget(
                player,
                players,
                GAME_CONFIG.MISSILE.TARGET_RANGE
            ),
        };

        missileIdRef.current++;
    }
}

export function explodeMissile(
    io: Server,
    missile: Missile,
    missiles: Record<number, Missile>,
    players: Record<string, Player>
) {

    io.emit("missileExplosion", {
        x: missile.x,
        y: missile.y,
    });

    for (const id in players) {

        const player = players[id];

        if (!player.isAlive) continue;

        if (player.id === missile.ownerId) continue;

        const dist = Math.hypot(
            player.x - missile.x,
            player.y - missile.y
        );

        if (dist > GAME_CONFIG.MISSILE.EXPLOSION_RADIUS) continue;

        // shield immunity
        const hasShield = player.shieldTimer > Date.now();

        if (!hasShield) {
            player.health -= GAME_CONFIG.MISSILE.DAMAGE;
        }
    }

    delete missiles[missile.id];
}

export function updateMissiles(
    io: Server,
    players: Record<string, Player>,
    missiles: Record<number, Missile>
) {

    for (const id in missiles) {

        const missile = missiles[id];

        if (!missile) continue;

        // ============================================
        // Homing Movement
        // ============================================

        const target = missile.targetId
            ? players[missile.targetId]
            : null;

        if (target && target.isAlive) {

            // desired angle toward target
            const desiredAngle = Math.atan2(
                target.y - missile.y,
                target.x - missile.x
            );

            // shortest angle difference
            let angleDiff = desiredAngle - missile.angle;

            while (angleDiff > Math.PI) {
                angleDiff -= Math.PI * 2;
            }

            while (angleDiff < -Math.PI) {
                angleDiff += Math.PI * 2;
            }

            // clamp turning speed
            angleDiff = Math.max(
                -GAME_CONFIG.MISSILE.TURN_RATE,
                Math.min(
                    GAME_CONFIG.MISSILE.TURN_RATE,
                    angleDiff
                )
            );

            missile.angle += angleDiff;
        }

        // updating velocity from angle
        missile.velocity.x =
            Math.cos(missile.angle) *
            GAME_CONFIG.MISSILE.SPEED;

        missile.velocity.y =
            Math.sin(missile.angle) *
            GAME_CONFIG.MISSILE.SPEED;

        // movement
        missile.x += missile.velocity.x;
        missile.y += missile.velocity.y;

        // ============================================
        // Collision Detection
        // ============================================

        for (const playerId in players) {

            const player = players[playerId];

            if (!player.isAlive) continue;

            if (player.id === missile.ownerId) continue;

            const dist = Math.hypot(
                player.x - missile.x,
                player.y - missile.y
            );

            if (dist < player.radius + 12) {

                explodeMissile(
                    io,
                    missile,
                    missiles,
                    players
                );

                break;
            }
        }

        missile.life--;

        if (missile.life <= 0) {

            explodeMissile(
                io,
                missile,
                missiles,
                players
            );

            continue;
        }
    }
}