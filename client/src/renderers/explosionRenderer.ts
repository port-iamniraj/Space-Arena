import { GAME_CONFIG } from "../config/gameConfig";

import { explosionImage } from "../assets/images";

type ExplosionEffect = {
    x: number;
    y: number;
    life: number;
};

type RenderExplosionEffectsParams = {
    ctx: CanvasRenderingContext2D;
    cameraX: number;
    cameraY: number;
    effects: ExplosionEffect[];
};

export function renderExplosionEffects({
    ctx,
    cameraX,
    cameraY,
    effects,
}: RenderExplosionEffectsParams) {

    for (let i = effects.length - 1; i >= 0; i--) {
        const effect = effects[i];

        const x = effect.x - cameraX;
        const y = effect.y - cameraY;

        const progress =
            1 -
            effect.life /
            GAME_CONFIG.EFFECTS.EXPLOSION.LIFE;

        const size =
            GAME_CONFIG.EFFECTS.EXPLOSION.START_SIZE +
            progress *
            (
                GAME_CONFIG.EFFECTS.EXPLOSION.END_SIZE -
                GAME_CONFIG.EFFECTS.EXPLOSION.START_SIZE
            );

        ctx.save();
        ctx.translate(x, y);

        ctx.globalAlpha = effect.life / GAME_CONFIG.EFFECTS.EXPLOSION.LIFE;
        ctx.shadowColor = GAME_CONFIG.EFFECTS.EXPLOSION.GLOW_COLOR;

        ctx.shadowBlur = GAME_CONFIG.EFFECTS.EXPLOSION.GLOW_BLUR;

        ctx.drawImage(
            explosionImage,
            -size / 2,
            -size / 2,
            size,
            size
        );

        ctx.restore();

        effect.life--;

        if (effect.life <= 0) effects.splice(i, 1);
    }
}