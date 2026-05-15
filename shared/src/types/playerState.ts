export type PlayerState = {
    id: string;

    name: string;

    x: number;
    y: number;

    radius: number;

    health: number;

    shieldTimer: number;

    score: number;

    isAlive: boolean;

    dx: number;
    dy: number;

    coins: number;

    skin: string;

    angle: number;

    upgrades: {
        speed: number;

        fireRate: number;

        damage: number;

        missile: boolean;
    };
};