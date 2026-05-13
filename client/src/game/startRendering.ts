import { socket } from "../network/socket";

import { GAME_CONFIG } from "../config/gameConfig";

import { getCamera } from "../utils/camera";

import { getViewport } from "../utils/viewport";

import { renderPlayers } from "../renderers/playerRenderer";

import { renderProjectiles } from "../renderers/projectileRenderers";

import { renderMissiles } from "../renderers/missileRenderer";

import { renderCollectibles } from "../renderers/collectibleRenderer";

import { renderDrops } from "../renderers/dropRenderer";

import { renderHitEffects } from "../renderers/hitEffectRenderer";

import { renderExplosionEffects } from "../renderers/explosionRenderer";

import { getHitEffects } from "../effects/hitEffects";

import { getExplosionEffects } from "../effects/explosionEffects";

import type { Player } from "../types/player";

import type { Projectile } from "../types/projectile";

import type { Missile } from "../types/missile";

import type { Collectible } from "../types/collectible";

import type { Drop } from "../types/drop";

type StartGameRendererParams = {
    canvas: HTMLCanvasElement;

    cameraRef:
    React.RefObject<{
        x: number;
        y: number;
    }>;

    playersRef:
    React.RefObject<
        Record<string, Player>
    >;

    projectilesRef:
    React.RefObject<
        Record<number, Projectile>
    >;

    missilesRef:
    React.RefObject<
        Record<number, Missile>
    >;

    collectiblesRef:
    React.RefObject<
        Record<number, Collectible>
    >;

    dropsRef:
    React.RefObject<
        Record<number, Drop>
    >;
};

export function startGameRenderer({
    canvas,

    cameraRef,

    playersRef,

    projectilesRef,

    missilesRef,

    collectiblesRef,

    dropsRef,
}: StartGameRendererParams) {

    const ctx =
        canvas.getContext("2d");

    if (!ctx) {
        return () => { };
    }

    let animationId = 0;

    const render = () => {

        const {
            width,
            height,
        } = getViewport();

        canvas.width = width;
        canvas.height = height;

        ctx.clearRect(
            0,
            0,
            width,
            height
        );

        const me =
            playersRef.current?.[
            socket.id || ""
            ];

        let cameraX = 0;
        let cameraY = 0;

        if (me) {

            const cam =
                getCamera(
                    me.x,
                    me.y,
                    width,
                    height
                );

            cameraRef.current!.x +=
                (
                    cam.cameraX -
                    cameraRef.current!.x
                ) *

                GAME_CONFIG.CAMERA.SMOOTHING;

            cameraRef.current!.y +=
                (
                    cam.cameraY -
                    cameraRef.current!.y
                ) *

                GAME_CONFIG.CAMERA.SMOOTHING;

            cameraX =
                cameraRef.current!.x;

            cameraY =
                cameraRef.current!.y;
        }

        renderHitEffects({
            ctx,

            cameraX,
            cameraY,

            effects:
                getHitEffects(),
        });

        renderProjectiles({
            ctx,

            cameraX,
            cameraY,

            projectiles:
                projectilesRef.current!,
        });

        renderDrops({
            ctx,

            cameraX,
            cameraY,

            drops:
                dropsRef.current!,
        });

        renderExplosionEffects({
            ctx,

            cameraX,
            cameraY,

            effects:
                getExplosionEffects(),
        });

        renderMissiles({
            ctx,

            cameraX,
            cameraY,

            missiles:
                missilesRef.current!,
        });

        renderPlayers({
            ctx,

            cameraX,
            cameraY,

            players:
                playersRef.current!,

            selfId:
                socket.id,
        });

        renderCollectibles({
            ctx,

            cameraX,
            cameraY,

            collectibles:
                collectiblesRef.current!,
        });

        animationId =
            requestAnimationFrame(
                render
            );
    };

    render();

    return () => {

        cancelAnimationFrame(
            animationId
        );
    };
}