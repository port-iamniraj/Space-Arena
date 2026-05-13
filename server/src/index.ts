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

server.listen(3000, () => {
    console.log("Server running on port 3000");
});