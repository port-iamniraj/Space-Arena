import { GAME_CONFIG } from "../config/gameConfig";

export function getMinimapPosition(
    x: number,
    y: number
) {
    const MINI_SIZE = GAME_CONFIG.MINIMAP.SIZE;
    const DOT_SIZE = GAME_CONFIG.MINIMAP.DOT_SIZE;
    const HALF_DOT = DOT_SIZE / 2;

    let miniX = (x / GAME_CONFIG.MAP.WIDTH) * MINI_SIZE;
    let miniY = (y / GAME_CONFIG.MAP.HEIGHT) * MINI_SIZE;

    miniX = Math.max(HALF_DOT, Math.min(MINI_SIZE - HALF_DOT, miniX));
    miniY = Math.max(HALF_DOT, Math.min(MINI_SIZE - HALF_DOT, miniY));

    return {
        miniX,
        miniY,
    };
}