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
  coins: number;
  skin: string;
  angle: number;
  upgrades: {
    speed: number;
    fireRate: number;
    bulletSpeed: number;
    damage: number;
  };
};

type UpgradeKey = "speed" | "fireRate" | "bulletSpeed" | "damage";

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

// ============================================
// THEME CONFIG (Visual Layer Only)
// ============================================

const THEME = {
  player: {
    self: {
      body: "#22c55e",
      ringBg: "#1f2937",
      ringHp: "#4ade80",
    },
    enemy: {
      body: "#ef4444",
      ringBg: "#1f2937",
      ringHp: "#22c55e",
    },
  },

  projectile: {
    color: "#ffffff",
    radius: 3,
  },

  collectible: {
    glowAlpha: 0.25,
  },
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
  const [isShopOpen, setIsShopOpen] = useState<boolean>(false)
  const [upgradeConfig, setUpgradeConfig] = useState<
    Record<UpgradeKey, {
      baseCost: number;
      costMultiplier: number;
      maxLevel: number;
    }> | null
  >(null);

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

    socketRef.current.on("upgradeConfig", (config) => {
      setUpgradeConfig(config);
    });

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

      // shoot direction update
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

      const projectilesData = projectilesRef.current; // Drawing projectiles

      ctx.fillStyle = THEME.projectile.color; // bright white bullets

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
        ctx.arc(x, y, THEME.projectile.radius, 0, Math.PI * 2); // smaller
        ctx.fill();
      }

      const playersData = playersRef.current; // Drawing players

      for (const id in playersData) {
        const p = playersData[id];

        if (!p.isAlive) continue;

        const x = p.x - cameraX;
        const y = p.y - cameraY;

        const angle = p.angle ?? 0;

        // health ring
        ctx.beginPath();
        ctx.arc(x, y, 16, 0, Math.PI * 2);
        ctx.strokeStyle =
          id === socketRef.current?.id
            ? THEME.player.self.ringBg
            : THEME.player.enemy.ringBg;
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
        ctx.strokeStyle =
          id === socketRef.current?.id
            ? THEME.player.self.ringHp
            : THEME.player.enemy.ringHp;
        ctx.lineWidth = 4;
        ctx.stroke();

        // player body

        // rotation
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        // color
        ctx.fillStyle =
          id === socketRef.current?.id
            ? THEME.player.self.body
            : THEME.player.enemy.body;

        // shapes
        if (p.skin === "default") {
          ctx.beginPath();
          ctx.arc(0, 0, 10, 0, Math.PI * 2);
          ctx.fill();
        }

        else if (p.skin === "fighter") {
          ctx.beginPath();
          ctx.moveTo(0, -12);
          ctx.lineTo(-8, 8);
          ctx.lineTo(8, 8);
          ctx.closePath();
          ctx.fill();
        }

        else if (p.skin === "interceptor") {
          ctx.beginPath();
          ctx.rect(-8, -8, 16, 16);
          ctx.fill();
        }

        ctx.restore();
      }

      const collectiblesData = collectiblesRef.current;  // Draw collectibles

      for (const id in collectiblesData) {
        const c = collectiblesData[id];

        const x = c.x - cameraX;
        const y = c.y - cameraY;

        // glow effect
        ctx.beginPath();
        ctx.arc(x, y, c.size * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(253, 224, 71, ${THEME.collectible.glowAlpha})`;
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

  const me = getMyPlayer(socketRef.current, players);

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

      <div className="absolute bottom-5 right-5 w-48 h-48 bg-gray-900 border border-gray-600 z-10 rounded">
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

      {/* Leaderboard */}
      <div className="text-white absolute top-5 right-5 w-75 z-20 p-4 border border-gray-600 rounded">
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

      <div className="text-white bg-gray-900 absolute top-5 left-5 flex flex-col gap-3 rounded z-20">
        <div className="border border-gray-600 px-6 py-2">
          Coins: {me ? me.coins : 0}
        </div>
        <button
          className="border border-gray-600 px-6 py-2 hover:bg-gray-800 cursor-pointer"
          onClick={() => setIsShopOpen((prev) => !prev)}
        >
          Shop
        </button>
      </div>

      {
        isShopOpen &&
        < div className="bg-gray-900 text-white w-150 p-5 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded border border-gray-600 z-30">
          <button

            className="bg-red-500 font-bold h-8 w-8 p-0 flex items-center justify-center absolute -top-2 -right-2 rounded-full hover:bg-gray-600 cursor-pointer"
            onClick={() => setIsShopOpen(prev => !prev)}
          >
            X
          </button>
          <span>Coins: {me ? me.coins : 0}</span>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {upgradeConfig &&
              Object.entries(upgradeConfig).map(([key, config]) => {
                const typedKey = key as UpgradeKey;
                const level = me?.upgrades?.[typedKey] ?? 0;

                const cost = config.baseCost * Math.pow(config.costMultiplier, level);

                const isMax = level >= config.maxLevel;
                const canBuy = me && me.coins >= cost && !isMax;

                return (
                  <button
                    key={key}
                    disabled={!canBuy}
                    onClick={() => socketRef.current?.emit("buyUpgrade", typedKey)}
                    className={`px-3 py-2 rounded ${canBuy
                      ? "bg-gray-700 hover:bg-gray-600"
                      : "bg-gray-800 opacity-50 cursor-not-allowed"
                      }`}
                  >
                    {key} (Lv {level}) - {isMax ? "MAX" : cost}
                  </button>
                );
              })}
          </div>

          <div className="mt-4">
            <div className="mb-2">Skins</div>

            <div className="flex gap-2">
              {["default", "fighter", "interceptor"].map((skin) => (
                <button
                  key={skin}
                  onClick={() => socketRef.current?.emit("changeSkin", skin)}
                  className="px-3 py-2 bg-gray-700 rounded hover:bg-gray-600"
                >
                  {skin}
                </button>
              ))}
            </div>
          </div>
        </div>
      }
    </div>
  );
}