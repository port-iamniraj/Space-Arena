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

    const moveInterval = window.setInterval(() => {
        const keys = keysRef.current!;

        let dx = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
        let dy = (keys.s ? 1 : 0) - (keys.w ? 1 : 0);

        const dir = normalize(dx, dy);

        const player = playersRef.current?.[socket.id || ""];

        socket.emit("move", dir);

        if (!player) return;

        const { width, height } = getViewport();

        const { cameraX, cameraY } =
            getCamera(
                player.x,
                player.y,
                width,
                height
            );

        const worldMouseX = mouseRef.current!.x + cameraX;
        const worldMouseY = mouseRef.current!.y + cameraY;

        const shootDir =
            normalize(
                worldMouseX - player.x,
                worldMouseY - player.y
            );

        socket.emit(
            "shoot",
            shootDir
        );

    }, 1000 / 60);

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