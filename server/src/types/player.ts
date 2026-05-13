export type Player = {
    id: string;
    x: number;
    y: number;
    radius: number;

    health: number;
    shieldTimer: number;
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
        damage: number;
    };

    upgrades: {
        speed: number;
        fireRate: number;
        damage: number;
        missile: boolean;
    };
};