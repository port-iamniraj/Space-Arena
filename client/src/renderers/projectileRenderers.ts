import { GAME_CONFIG } from "../config/gameConfig";

import { laserImage } from "../assets/images";

type Projectile = {
    x: number;
    y: number;
    angle: number;
};

type RenderProjectilesParams = {
    ctx: CanvasRenderingContext2D;
    cameraX: number;
    cameraY: number;
    projectiles: Record<number, Projectile>;
};

export function renderProjectiles({
    ctx,
    cameraX,
    cameraY,
    projectiles,
}: RenderProjectilesParams) {

    for (const id in projectiles) {

        const projectile = projectiles[id];

        const x = projectile.x - cameraX;
        const y = projectile.y - cameraY;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(projectile.angle + Math.PI / 2);

        ctx.shadowColor = GAME_CONFIG.PROJECTILE.GLOW_COLOR;
        ctx.shadowBlur = GAME_CONFIG.PROJECTILE.GLOW_BLUR;

        ctx.drawImage(
            laserImage,
            -GAME_CONFIG.PROJECTILE.WIDTH / 2,
            -GAME_CONFIG.PROJECTILE.HEIGHT / 2,
            GAME_CONFIG.PROJECTILE.WIDTH,
            GAME_CONFIG.PROJECTILE.HEIGHT
        );

        ctx.restore();
    }
}