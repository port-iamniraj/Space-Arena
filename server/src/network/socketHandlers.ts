import type { Server, Socket } from "socket.io";

import type { Player } from "../types/player";
import type { Drop } from "../types/drop";

import { GAME_CONFIG } from "../config/gameConfig";
import { UPGRADE_CONFIG, UPGRADE_CONFIG_WEAPONS } from "@game/shared";

const SKINS = ["default", "fighter", "interceptor"];

type RegisterSocketHandlersParams = {
    io: Server;
    socket: Socket;
    players: Record<string, Player>;
    drops: Record<number, Drop>;
};

type UpgradeKey = keyof Player["upgrades"];

export function registerSocketHandlers({
    io,
    socket,
    players,
    drops,
}: RegisterSocketHandlersParams) {

    console.log("User connected:", socket.id);

    socket.emit("upgradeConfig", UPGRADE_CONFIG);
    io.emit("updateDrops", drops);

    socket.on("joinGame", ({ name, skin }) => {

        console.log(
            "joinGame received",
            socket.id,
            name,
            skin
        );

        const safeName = name.trim().slice(0, 15);

        if (!safeName) return;

        players[socket.id] = {
            id: socket.id,
            name: safeName,

            x: Math.random() * GAME_CONFIG.MAP.WIDTH,
            y: Math.random() * GAME_CONFIG.MAP.HEIGHT,

            radius: GAME_CONFIG.PLAYER.RADIUS,

            health: 100,
            shieldTimer: 0,

            score: 0,
            coins: 0,

            isAlive: true,

            dx: 0,
            dy: 0,

            dxShoot: 0,
            dyShoot: 0,

            shotTick: 0,

            skin,
            angle: 0,

            baseStats: {
                speed: GAME_CONFIG.PLAYER.SPEED,
                fireRate: GAME_CONFIG.PROJECTILE.FIRE_RATE_TICKS,
                damage: GAME_CONFIG.PROJECTILE.DAMAGE,
            },

            upgrades: {
                speed: 0,
                fireRate: 0,
                damage: 0,
                missile: false,
            },
        };

        io.emit("playerMovement", players);
    });

    socket.on("disconnect", () => {

        console.log("User disconnected:", socket.id);

        if (players[socket.id]) {
            delete players[socket.id];
        }

        io.emit("playerMovement", players);
    });

    socket.on("move", (direction) => {

        const player = players[socket.id];

        if (!player || !player.isAlive) return;

        player.dx = direction.dx;
        player.dy = direction.dy;
    });

    socket.on("shoot", ({ dx, dy }) => {

        const player = players[socket.id];

        if (!player || !player.isAlive) return;

        player.angle = Math.atan2(dy, dx);

        player.dxShoot = dx;
        player.dyShoot = dy;
    });

    socket.on("buyUpgrade", (type: UpgradeKey) => {

        const player = players[socket.id];

        if (!player || !player.isAlive) return;

        if (type === "missile") {

            if (player.upgrades.missile) return;

            const MISSILE_COST = UPGRADE_CONFIG_WEAPONS.missile.baseCost;

            if (player.coins < MISSILE_COST) return;

            player.coins -= MISSILE_COST;
            player.upgrades.missile = true;

            return;
        }

        const config = UPGRADE_CONFIG[type];

        if (!config) return;

        const currentLevel = player.upgrades[type];

        if (currentLevel >= config.maxLevel) return;

        const cost =
            config.baseCost *
            Math.pow(config.costMultiplier, currentLevel);

        if (player.coins < cost) return;

        player.upgrades[type] += 1;
        player.coins -= cost;
    });

    socket.on("changeSkin", (skin) => {

        const player = players[socket.id];

        if (!player) return;

        if (!SKINS.includes(skin)) return;

        player.skin = skin;
    });
}