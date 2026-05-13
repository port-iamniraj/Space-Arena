import { GAME_CONFIG } from "../config/gameConfig";

import { missileImage } from "../assets/images";

type Missile = {
    x: number;
    y: number;
    renderX?: number;
    renderY?: number;
    angle: number;
};

type RenderMissilesParams = {
    ctx: CanvasRenderingContext2D;
    cameraX: number;
    cameraY: number;
    missiles: Record<number, Missile>;
};

export function renderMissiles({
    ctx,
    cameraX,
    cameraY,
    missiles,
}: RenderMissilesParams) {

    for (const id in missiles) {

        const missile = missiles[id];

        missile.renderX =
            missile.renderX! +

            (
                missile.x -
                missile.renderX!
            ) *

            GAME_CONFIG.MISSILE.SMOOTHING;

        missile.renderY =
            missile.renderY! +

            (
                missile.y -
                missile.renderY!
            ) *

            GAME_CONFIG.MISSILE.SMOOTHING;

        const x = missile.renderX - cameraX;
        const y = missile.renderY - cameraY;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(missile.angle + Math.PI / 2);

        ctx.shadowColor = GAME_CONFIG.MISSILE.GLOW_COLOR;
        ctx.shadowBlur = GAME_CONFIG.MISSILE.GLOW_BLUR;

        ctx.drawImage(
            missileImage,
            -GAME_CONFIG.MISSILE.WIDTH / 2,
            -GAME_CONFIG.MISSILE.HEIGHT / 2,
            GAME_CONFIG.MISSILE.WIDTH,
            GAME_CONFIG.MISSILE.HEIGHT
        );

        ctx.restore();
    }
}