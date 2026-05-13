import type { Collectible }
    from "../types/collectible";

export const collectibles:
    Record<number, Collectible> = {};

export const collectibleIdRef = {
    current: 0,
};