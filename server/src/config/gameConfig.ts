export const GAME_CONFIG = {
    MAP: {
        WIDTH: 3000,
        HEIGHT: 3000,
    },

    PLAYER: {
        SPEED: 15,
        RADIUS: 20,
        MAX_HEALTH: 100,
        RESPAWN_DELAY: 500,
    },

    PROJECTILE: {
        SPEED: 80,
        RANGE: 800,
        RADIUS: 5,
        FIRE_RATE_TICKS: 8,
        DAMAGE: 20,
    },

    MISSILE: {
        SPEED: 15,
        RANGE: 1200,
        DAMAGE: 60,
        TURN_RATE: 0.15,
        TARGET_RANGE: 700,
        EXPLOSION_RADIUS: 120,
    },

    COLLECTIBLE: {
        TARGET_COUNT: 1000,
        DROP_COUNT: 10,
        SIZE_MIN: 3,
        SIZE_MAX: 6,
        COLORS: ["#fde047", "#f87171", "#60a5fa", "#34d399"],
    },

    DROP: {
        MAX_COUNT: 30,
        RESPAWN_INTERVAL: 10000,
        SHIELD_DURATION: 10000,
    },

    GAME: {
        TICK_RATE: 50,
        COLLECTIBLE_SPAWN_INTERVAL: 500,
    }
};