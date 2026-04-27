import express from "express";
import http from "http";
import { Server } from "socket.io";

type Player = {
    id: string;
    x: number;
    y: number;
    radius: number;
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

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // creating player
    players[socket.id] = {
        id: socket.id,
        x: Math.random() * 500,
        y: Math.random() * 500,
        radius: 10,
    };

    io.emit("updatePlayers", players); // sending all players to everyone

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id); // remove player from the game

        delete players[socket.id];

        io.emit("updatePlayers", players); // notify all players about the updated list
    });

    socket.on("move", (direction: "up" | "down" | "left" | "right") => {
        const player = players[socket.id];

        if (!player) return;

        const speed = 5;

        if (direction === "up") player.y -= speed;
        if (direction === "down") player.y += speed;
        if (direction === "left") player.x -= speed;
        if (direction === "right") player.x += speed;

        // send updated players to everyone
        io.emit("updatePlayers", players);
    });

    socket.on("shoot", ({ x, y }: { x: number; y: number }) => {
        const player = players[socket.id];
        if (!player) return;

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
    for (const id in projectiles) {
        const projectile = projectiles[id];

        projectile.x += projectile.velocity.x;
        projectile.y += projectile.velocity.y;

        for (const playerId in players) {
            const player = players[playerId];

            if (playerId === projectile.ownerId) continue;

            const dist = Math.hypot(
                projectile.x - player.x,
                projectile.y - player.y
            );

            if (dist < projectile.radius + player.radius) {
                delete players[playerId]; // remove player
                delete projectiles[id]; // remove projectile

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

    io.emit("updatePlayers", players);
    io.emit("updateProjectiles", projectiles);
}, 50);

server.listen(3000, () => {
    console.log("Server running on port 3000");
});