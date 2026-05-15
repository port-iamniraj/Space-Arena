import express from "express";
import http from "http";
import { Server } from "socket.io";

import type { Player } from "./types/player";
import type { Drop } from "./types/drop";

import { startGameLoop } from "./game/startGameLoop";

import { spawnDrops } from "./systems/dropSystem";
import { registerSocketHandlers } from "./network/socketHandlers";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
    },
});

const players: Record<string, Player> = {};

const drops: Record<number, Drop> = {};
const dropIdRef = {
    current: 0,
};

spawnDrops(
    drops,
    dropIdRef
);

io.on("connection", (socket) => {
    registerSocketHandlers({
        io,
        socket,
        players,
        drops,
    });
});

startGameLoop({
    io,
    players,
    drops,
    dropIdRef,
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(
        `Server running on port ${PORT}`
    );
});