import type { Missile }
    from "../types/missile";

export const missiles:
    Record<number, Missile> = {};

export const missileIdRef = {
    current: 0,
};