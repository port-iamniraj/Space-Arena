import { useEffect, useRef, useState } from "react";

import type { Socket } from "socket.io-client";

import type { Player } from "./types/player";
import type { Projectile } from "./types/projectile";
import type { Missile } from "./types/missile";
import type { Collectible } from "./types/collectible";
import type { Drop } from "./types/drop";
import type { GameState } from "./types/gameState";

import { socket } from "./network/socket";
import { registerSocketEvents } from "./network/socketEvents";

import { registerInputHandlers } from "./inputs/inputHandlers";

import { startGameRenderer } from "./game/startRendering";

import { getMinimapPosition } from "./utils/minimap";

import { HomeScreen } from "./components/HomeScreen";
import { DeathScreen } from "./components/DeathScreen";

import { UPGRADE_CONFIG_WEAPONS } from "@game/shared";

type UpgradeKey = "speed" | "fireRate" | "damage";

function getMyPlayer(
  socket: Socket | null,
  players: Record<string, Player>
) {
  const id = socket?.id;

  return id ? players[id] : null;
}

export default function App() {

  const [gameState, setGameState] = useState<GameState>("home");

  const [playerName, setPlayerName] = useState("");
  const [selectedSkin, setSelectedSkin] = useState("default");

  const [players, setPlayers] = useState<Record<string, Player>>({});

  const [isShopOpen, setIsShopOpen] = useState(false);

  const [upgradeConfig, setUpgradeConfig] = useState<
    Record<
      UpgradeKey,
      {
        baseCost: number;
        costMultiplier: number;
        maxLevel: number;
      }
    > | null
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

  const handlePlay = () => {
    localStorage.setItem(
      "playerName",
      playerName
    );

    localStorage.setItem(
      "selectedSkin",
      selectedSkin
    );

    setGameState("playing");
  };

  const handleReturnHome = () => {
    setGameState("home");
  };

  useEffect(() => {

    socketRef.current = socket;

    socketRef.current.on(
      "connect",

      () => {

        console.log(
          "Connected:",
          socketRef.current?.id
        );

        const savedName =
          localStorage.getItem(
            "playerName"
          );

        const savedSkin =
          localStorage.getItem(
            "selectedSkin"
          );

        if (
          savedName &&
          savedSkin
        ) {

          socketRef.current?.emit(
            "joinGame",
            {
              name: savedName,
              skin: savedSkin,
            }
          );
        }
      }
    );

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

    socket.on("playerDead", () => {
      setGameState("dead");
    });

    socketRef.current.on("disconnect", () => {
      console.log("Disconnected");
    });

    return () => {
      if (!socketRef.current) return;

      socketRef.current.off("playerMovement");
      socketRef.current.off("updateProjectiles");
      socketRef.current.off("updateMissiles");
      socketRef.current.off("updateCollectibles");
      socketRef.current.off("updateDrops");
      socketRef.current.off("missileExplosion");

      socketRef.current.disconnect();
    };

  }, []);

  useEffect(() => {

    if (gameState !== "playing") return;

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

  }, [gameState]);

  useEffect(() => {

    if (gameState !== "playing") return;

    const canvas = canvasRef.current;

    if (!canvas) return;

    const cleanup = startGameRenderer({
      canvas,
      cameraRef,
      playersRef,
      projectilesRef,
      missilesRef,
      collectiblesRef,
      dropsRef,
    });

    return cleanup;

  }, [gameState]);

  const me = getMyPlayer(socketRef.current, players);

  const leaderboard = Object.values(players)
    .filter((player) => player.isAlive)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  if (gameState === "dead") {

    const me = players[socketRef.current?.id || ""];

    return (
      <DeathScreen
        score={me?.score || 0}
        onReturnHome={handleReturnHome}
        isShopOpen={isShopOpen}
        setIsShopOpen={setIsShopOpen}
      />
    );
  }

  if (gameState === "home") {

    return (
      <HomeScreen
        playerName={playerName}
        setPlayerName={setPlayerName}
        selectedSkin={selectedSkin}
        setSelectedSkin={setSelectedSkin}
        onPlay={handlePlay}
      />
    );
  }

  return (
    <div className="w-screen h-screen bg-gray-600 overflow-hidden relative">

      {/* Game Arena */}
      <div className="absolute inset-0 overflow-hidden bg-black">

        <canvas
          ref={canvasRef}
          className="absolute inset-0 z-30 pointer-events-none"
        />

      </div>

      {/* Minimap */}
      <div className="absolute bottom-5 right-5 z-10 w-32 h-32 rounded border border-gray-600 bg-gray-900">

        {
          me && (() => {

            const { miniX, miniY } = getMinimapPosition(me.x, me.y);

            return (
              <div
                className="absolute w-2 h-2 rounded-full bg-green-400 -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: miniX,
                  top: miniY,
                }}
              />
            );

          })()
        }

      </div>

      {/* Leaderboard */}
      <div className="absolute top-5 right-5 z-20 w-75 rounded border border-gray-600 bg-gray-900 p-4 text-white">

        <h3 className="mb-2 text-lg font-semibold">
          Leaderboard
        </h3>

        {
          leaderboard.map((p, index) => (
            <div
              key={p.id}
              className="flex justify-between text-sm"
            >
              <span>#{index + 1}. {p.name}</span>
              <span>{p.score}</span>
            </div>
          ))
        }

      </div>

      {/* Top Left HUD */}
      <div className="absolute top-5 left-5 z-20 flex flex-col gap-3 rounded bg-gray-900 text-white">

        <div className="border border-gray-600 px-6 py-2">
          Coins: {me ? me.coins : 0}
        </div>

        <button
          onClick={() => setIsShopOpen((prev) => !prev)}
          className="cursor-pointer border border-gray-600 px-6 py-2 hover:bg-gray-800"
        >
          Shop
        </button>

      </div>

      {/* Shop */}
      {
        isShopOpen && (

          <div className="absolute top-1/2 left-1/2 z-30 w-150 -translate-x-1/2 -translate-y-1/2 rounded border border-gray-600 bg-gray-900 p-5 text-white">

            <button
              onClick={() => setIsShopOpen((prev) => !prev)}
              className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 p-0 font-bold hover:bg-gray-600 cursor-pointer"
            >
              X
            </button>

            <span>
              Coins: {me ? me.coins : 0}
            </span>

            <div className="mt-3 grid grid-cols-2 gap-2">

              {
                upgradeConfig &&
                Object.entries(upgradeConfig).map(([key, config]) => {

                  const typedKey = key as UpgradeKey;

                  const level = me?.upgrades?.[typedKey] ?? 0;

                  const cost =
                    config.baseCost *
                    Math.pow(config.costMultiplier, level);

                  const isMax =
                    level >= config.maxLevel;

                  const canBuy =
                    me &&
                    me.coins >= cost &&
                    !isMax;

                  return (
                    <button
                      key={key}
                      disabled={!canBuy}
                      onClick={() =>
                        socketRef.current?.emit(
                          "buyUpgrade",
                          typedKey
                        )
                      }
                      className={`px-3 py-2 rounded ${canBuy
                        ? "bg-gray-700 hover:bg-gray-600"
                        : "bg-gray-800 opacity-50 cursor-not-allowed"
                        }`}
                    >
                      {key} (Lv {level}) - {isMax ? "MAX" : cost}
                    </button>
                  );
                })
              }

            </div>

            <div className="mt-5">

              <div className="mb-2 text-sm text-gray-400">
                Special Weapons
              </div>

              <button
                disabled={
                  me?.upgrades.missile ||
                  (me?.coins ?? 0) < UPGRADE_CONFIG_WEAPONS.missile.baseCost
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
                    : (me?.coins ?? 0) >= UPGRADE_CONFIG_WEAPONS.missile.baseCost
                      ? "bg-gray-700 hover:bg-gray-600"
                      : "bg-gray-800 opacity-50 cursor-not-allowed"
                  }
                                `}
              >
                <span>Homing Missile</span>

                <span>
                  {
                    me?.upgrades.missile
                      ? "OWNED"
                      : `${UPGRADE_CONFIG_WEAPONS.missile.baseCost}`
                  }
                </span>

              </button>

            </div>

          </div>
        )
      }

    </div>
  );
}