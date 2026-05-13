import { THEME } from "../config/themeConfig";

type Collectible = {
    x: number;
    y: number;
    size: number;
    color: string;
};

type RenderCollectiblesParams = {
    ctx: CanvasRenderingContext2D;
    cameraX: number;
    cameraY: number;
    collectibles: Record<number, Collectible>;
};

export function renderCollectibles({
    ctx,
    cameraX,
    cameraY,
    collectibles,
}: RenderCollectiblesParams) {

    for (const id in collectibles) {
        const collectible = collectibles[id];

        const x = collectible.x - cameraX;
        const y = collectible.y - cameraY;

        // glow
        ctx.beginPath();
        ctx.arc(
            x,
            y,
            collectible.size * 2,
            0,
            Math.PI * 2
        );
        ctx.fillStyle = `rgba(253, 224, 71, ${THEME.collectible.glowAlpha})`;
        ctx.fill();

        // core
        ctx.beginPath();
        ctx.arc(
            x,
            y,
            collectible.size,
            0,
            Math.PI * 2
        );
        ctx.fillStyle = collectible.color;
        ctx.fill();
    }
}