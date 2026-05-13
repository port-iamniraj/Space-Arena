import { GAME_CONFIG } from "../config/gameConfig";

import { skinImages, shieldImage, thrustImage } from "../assets/images";

type Player = {
    id: string;
    x: number;
    y: number;
    renderX?: number;
    renderY?: number;
    radius: number;
    health: number;
    shieldTimer: number;
    isAlive: boolean;
    dx: number;
    dy: number;
    skin: string;
    angle: number;
};

type RenderPlayersParams = {
    ctx: CanvasRenderingContext2D;
    cameraX: number;
    cameraY: number;
    players: Record<string, Player>;
    selfId?: string;
};

export function renderPlayers({
    ctx,
    cameraX,
    cameraY,
    players,
    selfId,
}: RenderPlayersParams) {

    for (const id in players) {

        const player = players[id];

        if (!player.isAlive) continue;

        // ============================================
        // SMOOTHING
        // ============================================

        if (player.renderX == null || player.renderY == null) {
            player.renderX = player.x;
            player.renderY = player.y;
        }

        const isMe = id === selfId;
        const smoothing =
            isMe ?
                GAME_CONFIG.PLAYER.SELF_SMOOTHING :
                GAME_CONFIG.PLAYER.ENEMY_SMOOTHING;

        player.renderX = player.renderX + (player.x - player.renderX) * smoothing;
        player.renderY = player.renderY + (player.y - player.renderY) * smoothing;

        const x = player.renderX! - cameraX;
        const y = player.renderY! - cameraY;

        const angle = player.angle ?? 0;

        // ============================================
        // SHIELD
        // ============================================

        const hasShield = player.shieldTimer > Date.now();

        if (hasShield && shieldImage.complete) {
            const pulse =
                Math.sin(
                    Date.now() *
                    GAME_CONFIG.SHIELD.PULSE_SPEED
                ) *
                GAME_CONFIG.SHIELD.PULSE_AMOUNT;

            const shieldSize = player.radius * 4 + pulse;

            ctx.save();

            ctx.translate(x, y);
            ctx.rotate(angle + Math.PI / 2);

            ctx.globalAlpha = 0.9;
            ctx.shadowColor = GAME_CONFIG.SHIELD.GLOW_COLOR;
            ctx.shadowBlur = GAME_CONFIG.SHIELD.GLOW_BLUR;

            ctx.drawImage(
                shieldImage,
                -shieldSize / 2,
                -shieldSize / 2,
                shieldSize,
                shieldSize
            );

            // shield timer arc

            const remaining = player.shieldTimer - Date.now();
            const percent = Math.max(0, remaining / GAME_CONFIG.SHIELD.DURATION);
            const arcRadius = shieldSize / 2 + GAME_CONFIG.SHIELD.ARC_OFFSET;

            ctx.beginPath();

            ctx.arc(
                0,
                0,
                arcRadius,
                -Math.PI / 2,
                -Math.PI / 2 +
                Math.PI * 2 * percent
            );

            ctx.strokeStyle = GAME_CONFIG.SHIELD.ARC_COLOR;

            ctx.lineWidth = 1;
            ctx.lineCap = "round";

            ctx.stroke();

            ctx.restore();
        }

        // ============================================
        // THRUST
        // ============================================

        const isMoving = Math.abs(player.dx) > 0 || Math.abs(player.dy) > 0;

        if (isMoving && thrustImage.complete) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle + Math.PI / 2);

            const flicker = Math.random() * GAME_CONFIG.THRUST.FLICKER_AMOUNT;

            const width = GAME_CONFIG.THRUST.WIDTH + flicker;
            const height = GAME_CONFIG.THRUST.HEIGHT + flicker;

            ctx.globalAlpha = GAME_CONFIG.THRUST.ALPHA;

            ctx.drawImage(
                thrustImage,
                -width / 2,
                GAME_CONFIG.THRUST.OFFSET_Y,
                width,
                height
            );

            ctx.restore();
        }

        // ============================================
        // HEALTH BAR
        // ============================================

        if (player.health < 100) {
            const healthPercent = player.health / 100;
            const barWidth = player.radius * GAME_CONFIG.PLAYER.HEALTH_BAR.WIDTH_MULTIPLIER;
            const barHeight = GAME_CONFIG.PLAYER.HEALTH_BAR.HEIGHT;

            const barX = x - barWidth / 2;
            const barY = y + player.radius + GAME_CONFIG.PLAYER.HEALTH_BAR.OFFSET_Y;

            let healthColor = GAME_CONFIG.PLAYER.HEALTH_BAR.FULL_COLOR;

            if (healthPercent < 0.6) {
                healthColor = GAME_CONFIG.PLAYER.HEALTH_BAR.MID_COLOR;
            }

            if (healthPercent < 0.3) {
                healthColor = GAME_CONFIG.PLAYER.HEALTH_BAR.LOW_COLOR;
            }

            ctx.fillStyle = GAME_CONFIG.PLAYER.HEALTH_BAR.BACKGROUND;

            ctx.beginPath();

            ctx.roundRect(
                barX,
                barY,
                barWidth,
                barHeight,
                999
            );

            ctx.fill();

            ctx.fillStyle = healthColor;

            ctx.shadowColor = healthColor;
            ctx.shadowBlur = 8;

            ctx.beginPath();

            ctx.roundRect(
                barX,
                barY,
                barWidth *
                healthPercent,
                barHeight,
                999
            );

            ctx.fill();

            ctx.shadowBlur = 0;
        }

        // ============================================
        // PLAYER BODY
        // ============================================

        ctx.save();

        ctx.translate(x, y);
        ctx.rotate(angle + Math.PI / 2);

        const image = skinImages[player.skin];

        if (image && image.complete) {
            const size = player.radius * 2.5;

            ctx.drawImage(
                image,
                -size / 2,
                -size / 2,
                size,
                size
            );
        }

        ctx.restore();
    }
}