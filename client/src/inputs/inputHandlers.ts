import type { Socket } from "socket.io-client";

import { normalize } from "../utils/math";
import { getCamera } from "../utils/camera";
import { getViewport } from "../utils/viewport";

type RegisterInputHandlersParams = {
    socket: Socket;
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
    playersRef: React.RefObject<any>;
    mouseRef:
    React.RefObject<{
        x: number;
        y: number;
    }>;
    keysRef:
    React.RefObject<{
        w: boolean;
        a: boolean;
        s: boolean;
        d: boolean;
    }>;
};

export function registerInputHandlers({
    socket,
    canvasRef,
    playersRef,
    mouseRef,
    keysRef,
}: RegisterInputHandlersParams) {

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "w") keysRef.current!.w = true;
        if (e.key === "a") keysRef.current!.a = true;
        if (e.key === "s") keysRef.current!.s = true;
        if (e.key === "d") keysRef.current!.d = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
        if (e.key === "w") keysRef.current!.w = false;
        if (e.key === "a") keysRef.current!.a = false;
        if (e.key === "s") keysRef.current!.s = false;
        if (e.key === "d") keysRef.current!.d = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
        const rect = canvasRef.current?.getBoundingClientRect();

        if (!rect) return;

        mouseRef.current!.x = e.clientX - rect.left;
        mouseRef.current!.y = e.clientY - rect.top;
    };

    let lastShootDx = 0;
    let lastShootDy = 0;

    const moveInterval = window.setInterval(() => {

        const keys = keysRef.current!;

        const dx =
            (keys.d ? 1 : 0) -
            (keys.a ? 1 : 0);

        const dy =
            (keys.s ? 1 : 0) -
            (keys.w ? 1 : 0);

        const dir = normalize(dx, dy);

        socket.emit("move", dir);

        const player = playersRef.current?.[socket.id || ""];

        if (!player) return;

        const { width, height } = getViewport();

        const { cameraX, cameraY } = getCamera(
            player.renderX ?? player.x,
            player.renderY ?? player.y,
            width,
            height
        );

        const worldMouseX =
            mouseRef.current!.x + cameraX;

        const worldMouseY =
            mouseRef.current!.y + cameraY;

        const shootDir = normalize(
            worldMouseX - player.x,
            worldMouseY - player.y
        );

        const changed =
            Math.abs(shootDir.dx - lastShootDx) > 0.01 ||
            Math.abs(shootDir.dy - lastShootDy) > 0.01;

        if (changed) {

            lastShootDx = shootDir.dx;
            lastShootDy = shootDir.dy;

            socket.emit("shoot", shootDir);
        }

    }, 1000 / 30);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
        clearInterval(moveInterval);

        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("keyup", handleKeyUp);
        window.removeEventListener("mousemove", handleMouseMove);
    };
}