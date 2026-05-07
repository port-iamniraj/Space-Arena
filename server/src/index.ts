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

    dxShoot: number;
    dyShoot: number;
    shotTick: number;

    coins: number;

    skin: string;

    angle: number;

    baseStats: {
        speed: number;
        fireRate: number;
        bulletSpeed: number;
        damage: number;
    };

    upgrades: {
        speed: number;
        fireRate: number;
        bulletSpeed: number;
        damage: number;
    };
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

// ============================================
// GAME CONFIG (Single Source of Truth)
// ============================================

const GAME_CONFIG = {
    MAP: {
        WIDTH: 3000,
        HEIGHT: 3000,
    },

    PLAYER: {
        SPEED: 15,
        RADIUS: 16,
        MAX_HEALTH: 100,
        RESPAWN_DELAY: 500,
    },

    PROJECTILE: {
        SPEED: 80,
        RANGE: 800,
        RADIUS: 5,
        FIRE_RATE_TICKS: 4,
        DAMAGE: 20,
    },

    COLLECTIBLE: {
        TARGET_COUNT: 1000,
        DROP_COUNT: 10,
        SIZE_MIN: 3,
        SIZE_MAX: 6,
        COLORS: ["#fde047", "#f87171", "#60a5fa", "#34d399"],
    },

    GAME: {
        TICK_RATE: 50,
        COLLECTIBLE_SPAWN_INTERVAL: 500,
    }
};

// ============================================
// Upgrade Config (Scaling + Limits)
// ============================================

const UPGRADE_CONFIG = {
    speed: {
        baseCost: 50,
        costMultiplier: 2,
        maxLevel: 5,
    },

    fireRate: {
        baseCost: 60,
        costMultiplier: 2,
        maxLevel: 5,
    },

    bulletSpeed: {
        baseCost: 70,
        costMultiplier: 2,
        maxLevel: 5,
    },

    damage: {
        baseCost: 100,
        costMultiplier: 2,
        maxLevel: 5,
    },
};

// ============================================
// Player Stat Resolver
// Combines base stats + upgrades into final stats
// ============================================
function getPlayerStats(player: Player) {
    return {
        speed: player.baseStats.speed + player.upgrades.speed,

        fireRate: Math.max(
            1,
            player.baseStats.fireRate - player.upgrades.fireRate // lower = faster shooting
        ),

        bulletSpeed: player.baseStats.bulletSpeed + player.upgrades.bulletSpeed,

        damage: player.baseStats.damage + player.upgrades.damage,
    };
}

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

// ============================================
// Available Skins
// ============================================

const SKINS = ["default", "fighter", "interceptor"];

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
        coins: 0,
        skin: "default",
        angle: 0,
        baseStats: {
            speed: GAME_CONFIG.PLAYER.SPEED,
            fireRate: GAME_CONFIG.PROJECTILE.FIRE_RATE_TICKS,
            bulletSpeed: GAME_CONFIG.PROJECTILE.SPEED,
            damage: GAME_CONFIG.PROJECTILE.DAMAGE,
        },
        upgrades: {
            speed: 0,
            fireRate: 0,
            bulletSpeed: 0,
            damage: 0,
        },
    };

    io.emit("updatePlayers", players); // sending all players to everyone
    socket.emit("upgradeConfig", UPGRADE_CONFIG); // sending upgrade config to the new player

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id); // removing player from the game

        delete players[socket.id];

        io.emit("updatePlayers", players); // notifying all players about the updated list
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

        // updating face angle
        player.angle = Math.atan2(dy, dx);

        // just store direction
        player.dxShoot = dx;
        player.dyShoot = dy;
    });

    // ============================================
    // Upgrading Purchase Handler
    // ============================================
    socket.on("buyUpgrade", (type: keyof Player["upgrades"]) => {
        const player = players[socket.id];
        if (!player || !player.isAlive) return;

        const config = UPGRADE_CONFIG[type];
        if (!config) return;

        const currentLevel = player.upgrades[type];

        if (currentLevel >= config.maxLevel) return; // max level check

        const cost = config.baseCost * Math.pow(config.costMultiplier, currentLevel); // dynamic cost

        if (player.coins < cost) return; // not enough coins

        player.upgrades[type] += 1; // apply upgrade

        player.coins -= cost; // deduct coins
    });

    socket.on("changeSkin", (skin: string) => {
        const player = players[socket.id];
        if (!player) return;

        if (!SKINS.includes(skin)) return;

        player.skin = skin;
    });
});

// ============================================
// Shooting System
// Handling bullet spawning
// ============================================
function handleShooting(
    players: Record<string, Player>,
    projectiles: Record<number, Projectile>
) {
    for (const playerId in players) {
        const player = players[playerId];
        const stats = getPlayerStats(player);

        if (!player.isAlive) continue;
        if (player.dxShoot === 0 && player.dyShoot === 0) continue;

        player.shotTick++;

        if (player.shotTick < stats.fireRate) continue;

        player.shotTick = 0;

        const offset = player.radius + GAME_CONFIG.PROJECTILE.RADIUS + 2;

        projectiles[projectileId] = {
            id: projectileId,
            x: player.x + player.dxShoot * offset,
            y: player.y + player.dyShoot * offset,
            radius: GAME_CONFIG.PROJECTILE.RADIUS,
            velocity: {
                x: player.dxShoot * stats.bulletSpeed,
                y: player.dyShoot * stats.bulletSpeed,
            },
            ownerId: playerId,
            life: Math.floor(
                GAME_CONFIG.PROJECTILE.RANGE / stats.bulletSpeed
            ),
            justSpawned: true,
        };

        projectileId++;
    }
}

// ============================================
// Player Movement System
// Updating player position and clamps to map
// ============================================
function updatePlayers(players: Record<string, Player>) {
    for (const playerId in players) {
        const player = players[playerId];
        const stats = getPlayerStats(player);

        if (!player.isAlive) continue;

        player.x += player.dx * stats.speed;
        player.y += player.dy * stats.speed;

        const r = player.radius;

        player.x = Math.max(r, Math.min(GAME_CONFIG.MAP.WIDTH - r, player.x));
        player.y = Math.max(r, Math.min(GAME_CONFIG.MAP.HEIGHT - r, player.y));
    }
}

// ============================================
// Projectile System
// Handling movement + collision + lifetime
// ============================================
function updateProjectiles(
    players: Record<string, Player>,
    projectiles: Record<number, Projectile>
) {
    for (const id in projectiles) {
        const projectile = projectiles[id];

        // preventing instant jump on spawn
        if (projectile.justSpawned) {
            projectile.justSpawned = false;
        } else {
            projectile.x += projectile.velocity.x;
            projectile.y += projectile.velocity.y;
        }

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
                ((player.x - prevX) * dx + (player.y - prevY) * dy) /
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
                const attackerStats = attacker ? getPlayerStats(attacker) : null;

                player.health -= attackerStats ? attackerStats.damage : GAME_CONFIG.PROJECTILE.DAMAGE;

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

// ============================================
// Death System
// Handling player death, scoring, and respawn
// ============================================
function handleDeaths(
    players: Record<string, Player>,
    collectibles: Record<number, Collectible>
) {
    for (const playerId in players) {
        const player = players[playerId];

        if (player.health <= 0 && player.isAlive) {
            player.isAlive = false;
            player.health = 0;

            const killerId = (player as any).lastHitBy;

            if (killerId && players[killerId]) {
                players[killerId].score += 5;
                players[killerId].coins += 5;
            }

            const DROP_COUNT = GAME_CONFIG.COLLECTIBLE.DROP_COUNT;

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
                    size:
                        GAME_CONFIG.COLLECTIBLE.SIZE_MIN +
                        Math.random() *
                        (GAME_CONFIG.COLLECTIBLE.SIZE_MAX -
                            GAME_CONFIG.COLLECTIBLE.SIZE_MIN),
                    color:
                        GAME_CONFIG.COLLECTIBLE.COLORS[
                        Math.floor(
                            Math.random() *
                            GAME_CONFIG.COLLECTIBLE.COLORS.length
                        )
                        ],
                };

                collectibleId++;
            }

            setTimeout(() => {
                player.x = Math.random() * 500;
                player.y = Math.random() * 300;
                player.health = GAME_CONFIG.PLAYER.MAX_HEALTH;
                player.isAlive = true;

                player.coins = 0;
                player.upgrades = {
                    speed: 0,
                    fireRate: 0,
                    bulletSpeed: 0,
                    damage: 0,
                };
            }, GAME_CONFIG.PLAYER.RESPAWN_DELAY);
        }
    }
}

// ============================================
// Collectible System
// Handling pickup logic
// ============================================
function handleCollectibles(
    players: Record<string, Player>,
    collectibles: Record<number, Collectible>
) {
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
                player.score += c.value;
                player.coins += c.value;
                delete collectibles[id];
            }
        }
    }
}

// Main game loop
setInterval(() => {
    handleShooting(players, projectiles);
    updatePlayers(players);
    updateProjectiles(players, projectiles);
    handleDeaths(players, collectibles);
    handleCollectibles(players, collectibles);

    io.emit("updatePlayers", players);
    io.emit("updateProjectiles", projectiles);
    io.emit("updateCollectibles", collectibles);
}, GAME_CONFIG.GAME.TICK_RATE);

setInterval(() => {
    const TARGET_COLLECTIBLES = GAME_CONFIG.COLLECTIBLE.TARGET_COUNT;

    const current = Object.keys(collectibles).length;

    const missing = TARGET_COLLECTIBLES - current;

    if (missing <= 0) return;

    for (let i = 0; i < missing; i++) {
        const x = Math.random() * GAME_CONFIG.MAP.WIDTH;
        const y = Math.random() * GAME_CONFIG.MAP.HEIGHT;

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
}, GAME_CONFIG.GAME.COLLECTIBLE_SPAWN_INTERVAL);

server.listen(3000, () => {
    console.log("Server running on port 3000");
});