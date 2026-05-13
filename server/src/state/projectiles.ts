import type { Projectile }
    from "../types/projectile";

export const projectiles:
    Record<number, Projectile> = {};

export const projectileIdRef = {
    current: 0,
};