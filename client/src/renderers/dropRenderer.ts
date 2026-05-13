import { GAME_CONFIG } from "../config/gameConfig";

import { dropImages } from "../assets/images";

type Drop = {
    id: number;
    x: number;
    y: number;
    type: | "health" | "shield";
};

type RenderDropsParams = {
    ctx: CanvasRenderingContext2D;
    cameraX: number;
    cameraY: number;
    drops: Record<number, Drop>;
};

export function renderDrops({
    ctx,
    cameraX,
    cameraY,
    drops,
}: RenderDropsParams) {

    for (const id in drops) {

        const drop = drops[id];

        const x = drop.x - cameraX;
        const y = drop.y - cameraY;

        const image = dropImages[drop.type];

        if (!image.complete) continue;

        const floatOffset =
            Math.sin(
                Date.now() *
                GAME_CONFIG.DROPS.FLOAT_SPEED +
                drop.id
            ) *
            GAME_CONFIG.DROPS.FLOAT_AMOUNT;

        ctx.save();
        ctx.translate(
            x,
            y + floatOffset
        );

        ctx.shadowColor =
            drop.type === "health"
                ? GAME_CONFIG.DROPS.HEALTH_GLOW
                : GAME_CONFIG.DROPS.SHIELD_GLOW;

        ctx.shadowBlur = GAME_CONFIG.DROPS.GLOW_BLUR;

        ctx.drawImage(
            image,
            -GAME_CONFIG.DROPS.SIZE / 2,
            -GAME_CONFIG.DROPS.SIZE / 2,
            GAME_CONFIG.DROPS.SIZE,
            GAME_CONFIG.DROPS.SIZE
        );

        ctx.restore();
    }
}