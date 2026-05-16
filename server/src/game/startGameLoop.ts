import type { Server } from "socket.io";

import type { Player } from "../types/player";
import type { Drop } from "../types/drop";

import { GAME_CONFIG } from "../config/gameConfig";

import { playerMovement } from "../systems/movementSystem";
import { handleShooting } from "../systems/shootingSystem";
import { updateProjectiles } from "../systems/projectileSystem";
import { handleDeaths } from "../systems/deathSystem";
import { spawnMissiles, updateMissiles } from "../systems/missileSystem";
import { handleCollectibles, spawnCollectibles } from "../systems/collectibleSystem";
import { spawnDrops, handleDropPickups } from "../systems/dropSystem";

import { projectiles, projectileIdRef } from "../state/projectiles";
import { missiles, missileIdRef } from "../state/missiles";
import { collectibles, collectibleIdRef } from "../state/collectibles";

type StartGameLoopParams = {
    io: Server;
    players: Record<string, Player>;
    drops: Record<number, Drop>;

    dropIdRef: {
        current: number;
    };
};

export function startGameLoop({
    io,
    players,
    drops,
    dropIdRef,
}: StartGameLoopParams) {

    function createMovementPayload(
        players: Record<string, Player>
    ) {

        const payload: Record<string, any> = {};

        for (const id in players) {

            const p = players[id];

            payload[id] = {
                id: p.id,

                x: p.x,
                y: p.y,

                angle: p.angle,

                health: p.health,

                shieldTimer:
                    p.shieldTimer,

                score: p.score,

                coins: p.coins,

                isAlive: p.isAlive,

                skin: p.skin,
            };
        }

        return payload;
    }

    setInterval(() => {
        playerMovement(players);

        handleShooting(
            players,
            projectiles,
            projectileIdRef
        );

        spawnMissiles(
            players,
            missiles,
            missileIdRef
        );

        updateMissiles(io, players, missiles);

        updateProjectiles(
            io,
            players,
            projectiles
        );

        handleDeaths(
            io,
            players,
            collectibles,
            collectibleIdRef
        );

        handleCollectibles(io, players, collectibles);
        handleDropPickups(io, players, drops);

        io.emit("playerMovement", createMovementPayload(players));
    }, GAME_CONFIG.GAME.TICK_RATE);

    setInterval(() => {
        io.emit("updateProjectiles", projectiles);
        io.emit("updateMissiles", missiles);
    }, 1000 / 15);

    setInterval(() => {
        spawnCollectibles(collectibles, collectibleIdRef);

        io.emit("updateCollectibles", collectibles);
    }, GAME_CONFIG.GAME.COLLECTIBLE_SPAWN_INTERVAL);

    setInterval(() => {
        spawnDrops(drops, dropIdRef);

        io.emit("updateDrops", drops);
    }, GAME_CONFIG.DROP.RESPAWN_INTERVAL);
}