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

type Enemy = {
    id: number;
    x: number;
    y: number;
    radius: number;
    speed: number;
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

const enemies: Record<number, Enemy> = {};
let enemyId = 0;

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // creating player
    players[socket.id] = {
        id: socket.id,
        x: Math.random() * 500,
        y: Math.random() * 500,
        radius: 10,
        health: 100,
        score: 0,
        isAlive: true
    };

    io.emit("updatePlayers", players); // sending all players to everyone

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id); // remove player from the game

        delete players[socket.id];

        io.emit("updatePlayers", players); // notify all players about the updated list
    });

    // player movement
    socket.on("move", (direction: "up" | "down" | "left" | "right") => {
        const player = players[socket.id];

        if (!player || !player.isAlive) return;

        const speed = 5;

        if (direction === "up") player.y -= speed;
        if (direction === "down") player.y += speed;
        if (direction === "left") player.x -= speed;
        if (direction === "right") player.x += speed;

        // send updated players to everyone
        io.emit("updatePlayers", players);
    });

    // player shooting
    socket.on("shoot", ({ x, y }: { x: number; y: number }) => {
        const player = players[socket.id];
        if (!player || !player.isAlive) return;

        const angle = Math.atan2(y - player.y, x - player.x);

        const speed = 5;
        const projectileRadius = 5

        // projectile spawning
        projectiles[projectileId] = {
            id: projectileId,
            x: player.x + Math.cos(angle) * 10,
            y: player.y + Math.sin(angle) * 10,
            radius: projectileRadius,
            velocity: {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed,
            },
            ownerId: socket.id,
        };

        projectileId++;
    });
});

setInterval(() => {
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

        for (const enemyId of Object.keys(enemies)) {
            const enemy = enemies[Number(enemyId)];

            const dist = Math.hypot(
                projectile.x - enemy.x,
                projectile.y - enemy.y
            );

            if (dist < projectile.radius + enemy.radius) {
                delete enemies[Number(enemyId)]; // enemy hit

                delete projectiles[id]; // remove projectile

                // give score to shooter
                const shooter = players[projectile.ownerId];
                if (shooter && shooter.isAlive) {
                    shooter.score += 1;
                }

                break;
            }
        }

        // remove if out of bounds
        if (
            projectile.x < 0 ||
            projectile.x > 600 ||
            projectile.y < 0 ||
            projectile.y > 400
        ) {
            delete projectiles[id];
        }
    }

    // enemy movement and collision
    for (const id of Object.keys(enemies)) {
        const enemyId = Number(id);
        const enemy = enemies[enemyId];

        // find closest player
        let closestPlayer: Player | null = null;
        let minDist = Infinity;

        for (const playerId in players) {
            const player = players[playerId];

            if (!player.isAlive) continue;

            const dist = Math.hypot(
                player.x - enemy.x,
                player.y - enemy.y
            );

            if (dist < minDist) {
                minDist = dist;
                closestPlayer = player;
            }
        }

        if (!closestPlayer) continue;

        const angle = Math.atan2(
            closestPlayer.y - enemy.y,
            closestPlayer.x - enemy.x
        );

        enemy.x += Math.cos(angle) * enemy.speed;
        enemy.y += Math.sin(angle) * enemy.speed;

        // collision
        for (const playerId in players) {
            const player = players[playerId];

            if (!player.isAlive) continue;

            const dist = Math.hypot(
                enemy.x - player.x,
                enemy.y - player.y
            );

            if (dist < enemy.radius + player.radius) {
                player.health -= 20;
                player.health = Math.max(player.health, 0);

                delete enemies[enemyId]; // removing enemy after hit

                break; // stop checking this enemy
            }
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
    io.emit("updateEnemies", enemies);
}, 50);

setInterval(() => {
    const radius = 10;

    const x = Math.random() * 600;
    const y = Math.random() * 400;

    enemies[enemyId] = {
        id: enemyId,
        x,
        y,
        radius,
        speed: 1,
    };

    enemyId++;
}, 2000);

server.listen(3000, () => {
    console.log("Server running on port 3000");
});