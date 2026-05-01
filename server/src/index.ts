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

        const speed = 5;
        const projectileRadius = 5;

        projectiles[projectileId] = {
            id: projectileId,
            x: player.x + dx * 10,
            y: player.y + dy * 10,
            radius: projectileRadius,
            velocity: {
                x: dx * speed,
                y: dy * speed,
            },
            ownerId: socket.id,
        };

        projectileId++;
    });
});

setInterval(() => {
    for (const playerId in players) {
        const player = players[playerId];

        if (!player.isAlive) continue;

        const speed = 50;

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

        projectile.x += projectile.velocity.x;
        projectile.y += projectile.velocity.y;

        for (const playerId in players) {
            const player = players[playerId];

            if (playerId === projectile.ownerId) continue;
            if (!player.isAlive) continue;

            const dist = Math.hypot(
                projectile.x - player.x,
                projectile.y - player.y
            );

            // projectile collision
            if (dist < projectile.radius + player.radius) {
                player.health -= 20; // damage
                player.health = Math.max(player.health, 0);

                delete projectiles[id]; // remove projectile

                break; // stop checking this enemy
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

            setTimeout(() => {
                player.x = Math.random() * 500;
                player.y = Math.random() * 300;
                player.health = 100;
                player.isAlive = true;
            }, 500);
        }
    }

    io.emit("updatePlayers", players);
    io.emit("updateProjectiles", projectiles);
}, 50);

server.listen(3000, () => {
    console.log("Server running on port 3000");
});