import { useEffect, useRef, useState } from "react";

import { startGameRenderer } from "./game/startRendering";

import type { Socket } from "socket.io-client";
import type { Player } from "./types/player";
import type { Projectile } from "./types/projectile";
import type { Missile } from "./types/missile";
import type { Collectible } from "./types/collectible";
import type { Drop } from "./types/drop";

import { socket } from "./network/socket";
import { registerSocketEvents } from "./network/socketEvents";

import { registerInputHandlers } from "./inputs/inputHandlers";

import { getMinimapPosition } from "./utils/minimap";

type UpgradeKey = "speed" | "fireRate" | "damage";

// const GAME_CONFIG = {
//   MAP_WIDTH: 3000,
//   MAP_HEIGHT: 3000,
//   MOVE_INTERVAL: 50,
//   SHOOT_INTERVAL: 200,
//   GRID_SIZE: 40,
//   MINIMAP_SIZE: 192,
//   PLAYER_SIZE: 20,
//   PLAYER_RING_SIZE: 32,
//   PROJECTILE_SIZE: 8,
// };

function getMyPlayer(
  socket: Socket | null,
  players: Record<string, Player>
) {
  const id = socket?.id;
  return id ? players[id] : null;
}

export default function App() {
  const [players, setPlayers] = useState<Record<string, Player>>({});
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
  const missilesRef = useRef<Record<number, Missile>>({});
  const collectiblesRef = useRef<Record<number, Collectible>>({});
  const dropsRef = useRef<Record<number, Drop>>({});
  const mouseRef = useRef({ x: 0, y: 0 });
  const cameraRef = useRef({
    x: 0,
    y: 0,
  });
  const keysRef = useRef({
    w: false,
    a: false,
    s: false,
    d: false,
  });

  useEffect(() => {
    socketRef.current = socket;

    registerSocketEvents({
      socket: socketRef.current,
      playersRef,
      missilesRef,
      projectilesRef,
      collectiblesRef,
      dropsRef,
      setPlayers,
      setUpgradeConfig,
    });

    socketRef.current.on("connect", () => {
      console.log("Connected:", socketRef.current?.id);
    });

    socketRef.current.on("disconnect", () => {
      console.log("Disconnected");
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.off("playerMovement");
        socketRef.current.off("updateProjectiles");
        socketRef.current.off("updateMissiles");
        socketRef.current.off("updateCollectibles");
        socketRef.current.off("updateDrops");
        socketRef.current.off("missileExplosion");
        socketRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (!socketRef.current) return;

    const cleanup =
      registerInputHandlers({
        socket: socketRef.current,
        canvasRef,
        playersRef,
        mouseRef,
        keysRef,
      });

    return cleanup;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const cleanup =
      startGameRenderer({
        canvas,
        cameraRef,
        playersRef,
        projectilesRef,
        missilesRef,
        collectiblesRef,
        dropsRef,
      });

    return cleanup;
  }, []);

  const me = getMyPlayer(socketRef.current, players);

  const leaderboard = [...Object.values(players)].sort(
    (a, b) => b.score - a.score
  );

  return (
    <div className="w-screen h-screen bg-gray-600 overflow-hidden relative">
      {/* Game Arena */}
      <div
        className="absolute inset-0 overflow-hidden bg-black"
      //     style={{
      //       backgroundColor: "#0f172a",
      //       backgroundImage: `
      //   linear-gradient(#1e293b 1px, transparent 1px),
      //   linear-gradient(90deg, #1e293b 1px, transparent 1px)
      // `,
      //       backgroundSize: `${GAME_CONFIG.MAP.GRID_SIZE}px ${GAME_CONFIG.MAP.GRID_SIZE}px`
      //     }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 z-30 pointer-events-none"
        />
      </div>

      <div className="absolute bottom-5 right-5 w-32 h-32 bg-gray-900 border border-gray-600 z-10 rounded">
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

          <div className="mt-5">

            <div className="mb-2 text-sm text-gray-400">
              Special Weapons
            </div>

            <button
              disabled={
                me?.upgrades.missile ||
                (me?.coins ?? 0) < 1000
              }

              onClick={() =>
                socketRef.current?.emit(
                  "buyUpgrade",
                  "missile"
                )
              }

              className={`
      w-full px-4 py-3 rounded
      flex items-center justify-between

      ${me?.upgrades.missile
                  ? "bg-blue-900 text-blue-200"
                  : (me?.coins ?? 0) >= 1000
                    ? "bg-gray-700 hover:bg-gray-600"
                    : "bg-gray-800 opacity-50 cursor-not-allowed"
                }
    `}
            >

              <span>
                Homing Missile
              </span>

              <span>
                {
                  me?.upgrades.missile
                    ? "OWNED"
                    : "1000"
                }
              </span>

            </button>
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