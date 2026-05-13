export const GAME_CONFIG = {
    MAP: {
        WIDTH: 3000,
        HEIGHT: 3000,
        GRID_SIZE: 40,
    },

    CAMERA: {
        SMOOTHING: 0.15,
    },

    PLAYER: {
        SIZE: 20,
        RING_SIZE: 32,

        SELF_SMOOTHING: 0.3,
        ENEMY_SMOOTHING: 0.2,

        HEALTH_BAR: {
            WIDTH_MULTIPLIER: 2.2,
            HEIGHT: 4,
            OFFSET_Y: 12,

            FULL_COLOR: "#22c55e",
            MID_COLOR: "#facc15",
            LOW_COLOR: "#ef4444",

            BACKGROUND: "rgba(255,255,255,0.12)",
        },
    },

    PROJECTILE: {
        SIZE: 8,

        WIDTH: 6,
        HEIGHT: 25,

        GLOW_COLOR: "#60a5fa",
        GLOW_BLUR: 10,
    },

    MISSILE: {
        WIDTH: 24,
        HEIGHT: 42,

        SMOOTHING: 0.25,

        GLOW_COLOR: "#fb7185",
        GLOW_BLUR: 20,
    },

    SHIELD: {
        DURATION: 10000,

        PULSE_SPEED: 0.01,
        PULSE_AMOUNT: 4,

        ARC_OFFSET: 6,

        ARC_COLOR: "#93c5fd",

        GLOW_COLOR: "#60a5fa",
        GLOW_BLUR: 25,
    },

    THRUST: {
        OFFSET_Y: 25,

        WIDTH: 10,
        HEIGHT: 30,

        FLICKER_AMOUNT: 4,

        ALPHA: 0.9,
    },

    EFFECTS: {
        HIT_LIFE: 8,

        HIT_SIZE: 40,

        HIT_GLOW_BLUR: 20,

        EXPLOSION: {
            LIFE: 14,

            START_SIZE: 40,
            END_SIZE: 120,

            GLOW_COLOR: "#fb7185",
            GLOW_BLUR: 40,
        },
    },

    DROPS: {
        SIZE: 20,

        FLOAT_SPEED: 0.005,
        FLOAT_AMOUNT: 4,

        HEALTH_GLOW: "#22c55e",
        SHIELD_GLOW: "#60a5fa",

        GLOW_BLUR: 20,
    },

    MINIMAP: {
        SIZE: 128,
        DOT_SIZE: 6,
    },

    INTERVALS: {
        MOVE: 50,
        SHOOT: 200,
    },
};