import { GAME_CONFIG } from "../config/gameConfig";

import { bodyHitImage, shieldHitImage } from "../assets/images";

type HitEffect = {
    x: number;
    y: number;
    life: number;
    type: | "normal" | "shield";
};

type RenderHitEffectsParams = {
    ctx: CanvasRenderingContext2D;
    cameraX: number;
    cameraY: number;
    effects: HitEffect[];
};

export function renderHitEffects({
    ctx,
    cameraX,
    cameraY,
    effects,
}: RenderHitEffectsParams) {

    for (let i = effects.length - 1; i >= 0; i--) {
        const effect = effects[i];

        const x = effect.x - cameraX;
        const y = effect.y - cameraY;

        const image =
            effect.type === "shield"
                ? shieldHitImage
                : bodyHitImage;

        ctx.save();
        ctx.translate(x, y);

        ctx.globalAlpha = effect.life / GAME_CONFIG.EFFECTS.HIT_LIFE;
        ctx.shadowColor =
            effect.type === "shield"
                ? "#60a5fa"
                : "#facc15";
        ctx.shadowBlur = GAME_CONFIG.EFFECTS.HIT_GLOW_BLUR;

        ctx.drawImage(
            image,
            -GAME_CONFIG.EFFECTS.HIT_SIZE / 2,
            -GAME_CONFIG.EFFECTS.HIT_SIZE / 2,
            GAME_CONFIG.EFFECTS.HIT_SIZE,
            GAME_CONFIG.EFFECTS.HIT_SIZE
        );

        ctx.restore();

        effect.life--;

        if (effect.life <= 0) effects.splice(i, 1);
    }
}