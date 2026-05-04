import express from "express";
import http from "http";
import { Server } from "socket.io";

type Player = {
    id: string;
    x: number;
    y: number;
    radius: number;
    health: number;
    score: number;
    isAlive: boolean;
    dx: number;
    dy: number;
    lastShotAt?: number;
    dxShoot: number;
    dyShoot: number;
    shotTick: number;
};

type Projectile = {
    id: number;
    x: number;
    y: number;
    radius: number;
    velocity: {
        x: number;
        y: number;
    };
    ownerId: string;
    life: number;
    justSpawned: boolean;
};

type Collectible = {
    id: number;
    x: number;
    y: number;
    value: number;
    size: number;
    color: string;
};

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
    },
});

const players: Record<string, Player> = {};
const projectiles: Record<number, Projectile> = {};
let projectileId = 0;

const collectibles: Record<number, Collectible> = {};
let collectibleId = 0;

const BULLET_SPEED = 80;
const BULLET_RANGE = 800;

const MAP_WIDTH = 3000;
const MAP_HEIGHT = 3000;

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // creating player
    players[socket.id] = {
        id: socket.id,
        x: Math.random() * 500,
        y: Math.random() * 500,
        radius: 16,
        health: 100,
        score: 0,
        isAlive: true,
        dx: 0,
        dy: 0,
        dxShoot: 0,
        dyShoot: 0,
        shotTick: 0,
    };

    io.emit("updatePlayers", players); // sending all players to everyone

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id); // remove player from the game

        delete players[socket.id];

        io.emit("updatePlayers", players); // notify all players about the updated list
    });

    // player movement
    socket.on("move", (direction: { dx: number; dy: number }) => {
        const player = players[socket.id];
        if (!player || !player.isAlive) return;

        player.dx = direction.dx;
        player.dy = direction.dy;
    });

    // player shooting
    socket.on("shoot", ({ dx, dy }: { dx: number; dy: number }) => {
        const player = players[socket.id];
        if (!player || !player.isAlive) return;

        // just store direction
        player.dxShoot = dx;
        player.dyShoot = dy;
    });
});

// Main game loop
setInterval(() => {
    // Shooting
    for (const playerId in players) {
        const player = players[playerId];

        if (!player.isAlive) continue;

        if (player.dxShoot === 0 && player.dyShoot === 0) continue;

        const FIRE_RATE_TICKS = 4; // 4 ticks = 200ms

        player.shotTick++;

        if (player.shotTick < FIRE_RATE_TICKS) continue;

        player.shotTick = 0;

        const PROJECTILE_RADIUS = 5;
        const SPAWN_OFFSET = player.radius

        projectiles[projectileId] = {
            id: projectileId,
            x: player.x + player.dxShoot * SPAWN_OFFSET,
            y: player.y + player.dyShoot * SPAWN_OFFSET,
            radius: PROJECTILE_RADIUS,
            velocity: {
                x: player.dxShoot * BULLET_SPEED,
                y: player.dyShoot * BULLET_SPEED,
            },
            ownerId: playerId,
            life: Math.floor(BULLET_RANGE / BULLET_SPEED),
            justSpawned: true,
        };

        projectileId++;
    }

    // player movement
    for (const playerId in players) {
        const player = players[playerId];

        if (!player.isAlive) continue;

        const speed = 15;

        player.x += player.dx * speed;
        player.y += player.dy * speed;

        const PLAYER_RADIUS = player.radius || 10;

        // 🔥 Clamp player inside world
        player.x = Math.max(
            PLAYER_RADIUS,
            Math.min(MAP_WIDTH - PLAYER_RADIUS, player.x)
        );

        player.y = Math.max(
            PLAYER_RADIUS,
            Math.min(MAP_HEIGHT - PLAYER_RADIUS, player.y)
        );
    }

    // projectile movement and collision
    for (const id in projectiles) {
        const projectile = projectiles[id];

        if (projectile.justSpawned) {
            projectile.justSpawned = false;
        } else {
            projectile.x += projectile.velocity.x;
            projectile.y += projectile.velocity.y;
        }

        projectile.life--;

        if (projectile.life <= 0) {
            delete projectiles[id];
            continue;
        }

        for (const playerId in players) {
            const player = players[playerId];

            if (playerId === projectile.ownerId) continue;
            if (!player.isAlive) continue;

            // previous position
            const prevX = projectile.x - projectile.velocity.x;
            const prevY = projectile.y - projectile.velocity.y;

            // line segment from prev → current
            const dx = projectile.x - prevX;
            const dy = projectile.y - prevY;

            // project player onto that line
            const t =
                ((player.x - prevX) * dx + (player.y - prevY) * dy) /
                (dx * dx + dy * dy);

            // clamp t between 0 and 1
            const clampedT = Math.max(0, Math.min(1, t));

            // closest point on bullet path
            const closestX = prevX + dx * clampedT;
            const closestY = prevY + dy * clampedT;

            // distance from player to path
            const dist = Math.hypot(
                closestX - player.x,
                closestY - player.y
            );

            if (dist < projectile.radius + player.radius) {
                player.health -= 20;
                player.health = Math.max(player.health, 0);

                // 🔥 track last attacker
                (player as any).lastHitBy = projectile.ownerId;

                delete projectiles[id];

                break;
            }
        }

        // remove if out of bounds
        if (
            projectile.x < 0 ||
            projectile.x > MAP_WIDTH ||
            projectile.y < 0 ||
            projectile.y > MAP_HEIGHT
        ) {
            delete projectiles[id];
        }
    }

    // GLOBAL DEATH HANDLER
    for (const playerId in players) {
        const player = players[playerId];

        if (player.health <= 0 && player.isAlive) {
            player.isAlive = false;
            player.health = 0;

            const killerId = (player as any).lastHitBy;

            // 🔥 reward killer
            if (killerId && players[killerId]) {
                players[killerId].score += 5;
            }

            // 💥 DROP LOOT
            const DROP_COUNT = 10;

            for (let i = 0; i < DROP_COUNT; i++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * 30;

                const x = player.x + Math.cos(angle) * distance;
                const y = player.y + Math.sin(angle) * distance;

                collectibles[collectibleId] = {
                    id: collectibleId,
                    x,
                    y,
                    value: 1,
                    size: 3 + Math.random() * 3,
                    color: ["#fde047", "#f87171", "#60a5fa", "#34d399"][Math.floor(Math.random() * 4)],
                };

                collectibleId++;
            }

            setTimeout(() => {
                player.x = Math.random() * 500;
                player.y = Math.random() * 300;
                player.health = 100;
                player.isAlive = true;
            }, 500);
        }
    }

    // Collectibles
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
                // collect
                player.score += c.value;

                delete collectibles[id];
            }
        }
    }

    io.emit("updatePlayers", players);
    io.emit("updateProjectiles", projectiles);
    io.emit("updateCollectibles", collectibles);
}, 50);

setInterval(() => {
    const TARGET_COLLECTIBLES = 1000;

    const current = Object.keys(collectibles).length;

    const missing = TARGET_COLLECTIBLES - current;

    if (missing <= 0) return;

    for (let i = 0; i < missing; i++) {
        const x = Math.random() * MAP_WIDTH;
        const y = Math.random() * MAP_HEIGHT;

        collectibles[collectibleId] = {
            id: collectibleId,
            x,
            y,
            value: 1,
            size: 3 + Math.random() * 3,
            color: ["#fde047", "#f87171", "#60a5fa", "#34d399"][Math.floor(Math.random() * 4)],
        };

        collectibleId++;
    }
}, 500);

server.listen(3000, () => {
    console.log("Server running on port 3000");
});