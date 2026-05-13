import { GAME_CONFIG } from "../config/gameConfig";

export function getCamera(
    playerX: number,
    playerY: number,
    viewWidth: number,
    viewHeight: number
) {
    let cameraX = playerX - viewWidth / 2;
    let cameraY = playerY - viewHeight / 2;

    cameraX = Math.max(0, Math.min(GAME_CONFIG.MAP.WIDTH - viewWidth, cameraX));
    cameraY = Math.max(0, Math.min(GAME_CONFIG.MAP.HEIGHT - viewHeight, cameraY));

    return { cameraX, cameraY };
}