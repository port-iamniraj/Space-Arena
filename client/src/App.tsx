import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";

type Player = {
  id: string;
  x: number;
  y: number;
  health: number;
  score: number;
  isAlive: boolean
};

type Projectile = {
  id: number;
  x: number;
  y: number;
};

const GAME_CONFIG = {
  MAP_WIDTH: 3000,
  MAP_HEIGHT: 3000,
  MOVE_INTERVAL: 50,
  SHOOT_INTERVAL: 200,
  GRID_SIZE: 40,
  MINIMAP_SIZE: 192,
  PLAYER_SIZE: 20,
  PLAYER_RING_SIZE: 32,
  PROJECTILE_SIZE: 8,
};

function getCamera(
  playerX: number,
  playerY: number,
  viewWidth: number,
  viewHeight: number
) {
  let cameraX = playerX - viewWidth / 2;
  let cameraY = playerY - viewHeight / 2;

  cameraX = Math.max(
    0,
    Math.min(GAME_CONFIG.MAP_WIDTH - viewWidth, cameraX)
  );

  cameraY = Math.max(
    0,
    Math.min(GAME_CONFIG.MAP_HEIGHT - viewHeight, cameraY)
  );

  return { cameraX, cameraY };
}

function normalize(dx: number, dy: number) {
  const length = Math.hypot(dx, dy);
  if (length === 0) return { dx: 0, dy: 0 };

  return {
    dx: dx / length,
    dy: dy / length,
  };
}

function getViewport() {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

function getMinimapPosition(x: number, y: number) {
  const MAP_WIDTH = GAME_CONFIG.MAP_WIDTH;
  const MAP_HEIGHT = GAME_CONFIG.MAP_HEIGHT;

  const MINI_SIZE = GAME_CONFIG.MINIMAP_SIZE;
  const DOT_SIZE = 6;
  const HALF_DOT = DOT_SIZE / 2;

  let miniX = (x / MAP_WIDTH) * MINI_SIZE;
  let miniY = (y / MAP_HEIGHT) * MINI_SIZE;

  miniX = Math.max(HALF_DOT, Math.min(MINI_SIZE - HALF_DOT, miniX));
  miniY = Math.max(HALF_DOT, Math.min(MINI_SIZE - HALF_DOT, miniY));

  return { miniX, miniY };
}

export default function App() {
  const socketRef = useRef<Socket | null>(null);
  const [players, setPlayers] = useState<Record<string, Player>>({})
  const [projectiles, setProjectiles] = useState<Record<number, Projectile>>({});
  const playersRef = useRef<Record<string, Player>>({});
  const gameRef = useRef<HTMLDivElement | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const keysRef = useRef({
    w: false,
    a: false,
    s: false,
    d: false,
  });

  useEffect(() => {
    socketRef.current = io("http://localhost:3000");

    socketRef.current.on("connect", () => {
      console.log("Connected:", socketRef.current?.id);
    });

    socketRef.current.on("updatePlayers", (serverPlayers: Record<string, Player>) => {
      setPlayers(serverPlayers);
      playersRef.current = serverPlayers;
    });

    socketRef.current.on("updateProjectiles", (serverProjectiles: Record<number, Projectile>) => {
      setProjectiles(serverProjectiles);
    });

    socketRef.current.on("disconnect", () => {
      console.log("Disconnected");
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.off("updatePlayers");
        socketRef.current.off("updateProjectiles");
        socketRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "w") keysRef.current.w = true;
      if (e.key === "s") keysRef.current.s = true;
      if (e.key === "a") keysRef.current.a = true;
      if (e.key === "d") keysRef.current.d = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "w") keysRef.current.w = false;
      if (e.key === "s") keysRef.current.s = false;
      if (e.key === "a") keysRef.current.a = false;
      if (e.key === "d") keysRef.current.d = false;
    };

    const moveInterval = setInterval(() => {
      const keys = keysRef.current;

      let dx = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
      let dy = (keys.s ? 1 : 0) - (keys.w ? 1 : 0);

      const dir = normalize(dx, dy);

      if (!socketRef.current) return;
      socketRef.current.emit("move", dir);
    }, GAME_CONFIG.MOVE_INTERVAL);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = gameRef.current?.getBoundingClientRect();

      if (!rect) return;

      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    };

    const shootInterval = setInterval(() => {
      const socketId = socketRef.current?.id;
      if (!socketId) return;

      const player = playersRef.current[socketId];
      if (!player) return;

      const { width: viewWidth, height: viewHeight } = getViewport();

      const { cameraX, cameraY } = getCamera(
        player.x,
        player.y,
        viewWidth,
        viewHeight
      );

      const worldMouseX = mouseRef.current.x + cameraX;
      const worldMouseY = mouseRef.current.y + cameraY;

      const dir = normalize(
        worldMouseX - player.x,
        worldMouseY - player.y
      );

      if (dir.dx === 0 && dir.dy === 0) return;

      if (!socketRef.current) return;
      socketRef.current.emit("shoot", dir);
    }, GAME_CONFIG.SHOOT_INTERVAL);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      clearInterval(moveInterval);
      clearInterval(shootInterval);
    };
  }, []);

  const socketId = socketRef.current?.id;
  const me = socketId ? players[socketId] : null;

  if (!me) {
    return (
      <div className="w-screen h-screen flex items-center justify-center text-white">
        Connecting...
      </div>
    );
  }

  const { width: cameraViewWidth, height: cameraViewHeight } = getViewport();

  const { cameraX, cameraY } = getCamera(
    me.x,
    me.y,
    cameraViewWidth,
    cameraViewHeight
  );

  const leaderboard = [...Object.values(players)].sort(
    (a, b) => b.score - a.score
  );

  return (
    <div className="w-screen h-screen bg-gray-600 overflow-hidden relative">
      {/* Game Arena */}
      <div
        ref={gameRef}
        className="absolute inset-0 overflow-hidden"
        style={{
          backgroundColor: "#0f172a",
          backgroundImage: `
      linear-gradient(#1e293b 1px, transparent 1px),
      linear-gradient(90deg, #1e293b 1px, transparent 1px)
    `,
          backgroundSize: `${GAME_CONFIG.GRID_SIZE}px ${GAME_CONFIG.GRID_SIZE}px`
        }}
      >
        {
          Object.values(players)
            .filter(player => player.isAlive)
            .map((player) => (
              <div
                key={player.id}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: player.x - cameraX,
                  top: player.y - cameraY,
                }}
              >
                {/* Health Ring */}
                <div
                  className="absolute w-8 h-8 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  style={{
                    background: `conic-gradient(#22c55e ${player.health}%, #1f2937 ${player.health}%)`,
                    WebkitMask: "radial-gradient(circle, transparent 60%, black 61%)",
                    mask: "radial-gradient(circle, transparent 60%, black 61%)",
                  }}
                />

                {/* Inner Player Circle */}
                <div
                  className={`absolute w-5 h-5 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${player.id === socketRef.current?.id ? "bg-green-400" : "bg-red-400"}`}
                />
              </div>
            ))
        }

        {
          Object.values(projectiles).map((p) => (
            <div
              key={p.id}
              className="absolute w-2 h-2 bg-yellow-400 rounded-full -translate-x-1/2 -translate-y-1/2"
              style={{
                left: p.x - cameraX,
                top: p.y - cameraY,
              }}
            />
          ))
        }
      </div>

      <div className="absolute top-5 right-5 w-48 h-48 bg-gray-900 border border-gray-600 z-10 rounded">
        {Object.values(players).map((p) => {
          const { miniX, miniY } = getMinimapPosition(p.x, p.y);

          return (
            <div
              key={p.id}
              className={`absolute w-1.5 h-1.5 rounded-full -translate-x-1/2 -translate-y-1/2 
                ${p.id === socketRef.current?.id ? "bg-green-400" : "bg-red-400"}`}
              style={{
                left: miniX,
                top: miniY,
              }}
            />
          );
        })}
      </div>

      <div className="mt-6 w-75">
        <h3 className="text-lg font-semibold mb-2">Leaderboard</h3>

        {
          leaderboard.map((p) => (
            <div key={p.id} className="flex justify-between text-sm">
              <span>{p.id.slice(0, 4)}</span>
              <span>{p.score}</span>
            </div>
          ))
        }
      </div>
    </div>
  );
}