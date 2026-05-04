import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";

type Player = {
  id: string;
  x: number;
  y: number;
  health: number;
  score: number;
  isAlive: boolean;
};

type Projectile = {
  id: number;
  x: number;
  y: number;
};

type Collectible = {
  id: number;
  x: number;
  y: number;
  value: number;
  size: number;
  color: string
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

function getMyPlayer(
  socket: Socket | null,
  players: Record<string, Player>
) {
  const id = socket?.id;
  return id ? players[id] : null;
}

export default function App() {
  const socketRef = useRef<Socket | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const playersRef = useRef<Record<string, Player>>({});
  const projectilesRef = useRef<Record<number, Projectile>>({});
  const prevProjectilesRef = useRef<Record<number, Projectile>>({});
  const collectiblesRef = useRef<Record<number, Collectible>>({});
  const mouseRef = useRef({ x: 0, y: 0 });
  const keysRef = useRef({
    w: false,
    a: false,
    s: false,
    d: false,
  });

  const [players, setPlayers] = useState<Record<string, Player>>({});

  useEffect(() => {
    socketRef.current = io("http://localhost:3000");

    socketRef.current.on("connect", () => {
      console.log("Connected:", socketRef.current?.id);
    });

    socketRef.current.on("updatePlayers", (serverPlayers: Record<string, Player>) => {
      playersRef.current = serverPlayers;
      setPlayers(serverPlayers);
    });

    socketRef.current.on("updateProjectiles", (serverProjectiles: Record<number, Projectile>) => {
      prevProjectilesRef.current = projectilesRef.current;
      projectilesRef.current = serverProjectiles;
    });

    socketRef.current.on(
      "updateCollectibles",
      (serverCollectibles: Record<number, Collectible>) => {
        collectiblesRef.current = serverCollectibles;
      }
    );

    socketRef.current.on("disconnect", () => {
      console.log("Disconnected");
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.off("updatePlayers");
        socketRef.current.off("updateProjectiles");
        socketRef.current.off("updateCollectibles");
        socketRef.current.disconnect();
      }
    };
  }, []);

  // INPUT HANDLING
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

    let moveInterval: number = window.setInterval(() => {
      const keys = keysRef.current;

      let dx = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
      let dy = (keys.s ? 1 : 0) - (keys.w ? 1 : 0);

      const dir = normalize(dx, dy);

      const socket = socketRef.current;
      if (!socket) return;

      socket.emit("move", dir);

      // 🔥 ADD THIS (shoot direction update)
      const player = playersRef.current[socket.id || ""];
      if (!player) return;

      const { width, height } = getViewport();
      const { cameraX, cameraY } = getCamera(player.x, player.y, width, height);

      const worldMouseX = mouseRef.current.x + cameraX;
      const worldMouseY = mouseRef.current.y + cameraY;

      const shootDir = normalize(
        worldMouseX - player.x,
        worldMouseY - player.y
      );

      socket.emit("shoot", shootDir);

    }, GAME_CONFIG.MOVE_INTERVAL);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();

      if (!rect) return;

      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      clearInterval(moveInterval);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    const render = () => {
      const { width, height } = getViewport();
      canvas.width = width;
      canvas.height = height;

      ctx.clearRect(0, 0, width, height);

      const me = getMyPlayer(socketRef.current, playersRef.current);

      let cameraX = 0;
      let cameraY = 0;

      if (me) {
        const cam = getCamera(me.x, me.y, width, height);
        cameraX = cam.cameraX;
        cameraY = cam.cameraY;
      }

      // DRAW PROJECTILES
      const projectilesData = projectilesRef.current;

      ctx.fillStyle = "#ffffff"; // bright white bullets

      for (const id in projectilesData) {
        const p = projectilesData[id];
        const prev = prevProjectilesRef.current[id];

        let renderX = p.x;
        let renderY = p.y;

        if (prev) {
          const alpha = 0.5; // interpolation factor

          renderX = prev.x + (p.x - prev.x) * alpha;
          renderY = prev.y + (p.y - prev.y) * alpha;
        }

        const x = renderX - cameraX;
        const y = renderY - cameraY;

        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2); // smaller
        ctx.fill();
      }

      // DRAW PLAYERS
      const playersData = playersRef.current;

      for (const id in playersData) {
        const p = playersData[id];

        if (!p.isAlive) continue;

        const x = p.x - cameraX;
        const y = p.y - cameraY;

        // health ring
        ctx.beginPath();
        ctx.arc(x, y, 16, 0, Math.PI * 2);
        ctx.strokeStyle = "#1f2937";
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(
          x,
          y,
          16,
          -Math.PI / 2,
          -Math.PI / 2 + (Math.PI * 2 * p.health) / 100
        );
        ctx.strokeStyle = "#22c55e";
        ctx.lineWidth = 4;
        ctx.stroke();

        // player body
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fillStyle =
          id === socketRef.current?.id ? "#4ade80" : "#f87171";
        ctx.fill();
      }

      // 🔥 DRAW COLLECTIBLES
      const collectiblesData = collectiblesRef.current;

      for (const id in collectiblesData) {
        const c = collectiblesData[id];

        const x = c.x - cameraX;
        const y = c.y - cameraY;

        // glow effect
        ctx.beginPath();
        ctx.arc(x, y, c.size * 2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(253, 224, 71, 0.2)";
        ctx.fill();

        // core
        ctx.beginPath();
        ctx.arc(x, y, c.size, 0, Math.PI * 2);
        ctx.fillStyle = c.color;
        ctx.fill();
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  const leaderboard = [...Object.values(players)].sort(
    (a, b) => b.score - a.score
  );

  return (
    <div className="w-screen h-screen bg-gray-600 overflow-hidden relative">
      {/* Game Arena */}
      <div
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
        <canvas
          ref={canvasRef}
          className="absolute inset-0 z-30 pointer-events-none"
        />
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

      <div className="absolute top-5 left-5 w-75 z-20 text-white p-4 border border-gray-600 rounded">
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