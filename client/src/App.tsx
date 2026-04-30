import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

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

type Enemy = {
  id: number;
  x: number;
  y: number;
};

export default function App() {
  const [players, setPlayers] = useState<Record<string, Player>>({})
  const [projectiles, setProjectiles] = useState<Record<number, Projectile>>({});
  const [enemies, setEnemies] = useState<Record<number, Enemy>>({});

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to server:", socket.id);
    });

    socket.on("updatePlayers", (serverPlayers) => {
      // console.log("Players:", serverPlayers);
      setPlayers(serverPlayers);
    });

    socket.on("updateEnemies", (serverEnemies) => {
      setEnemies(serverEnemies);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected");
    });

    socket.on("updateProjectiles", (serverProjectiles) => {
      setProjectiles(serverProjectiles);
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "w") socket.emit("move", "up");
      if (e.key === "s") socket.emit("move", "down");
      if (e.key === "a") socket.emit("move", "left");
      if (e.key === "d") socket.emit("move", "right");
    };

    const handleClick = (e: MouseEvent) => {
      const rect = (e.target as HTMLElement).getBoundingClientRect();

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      socket.emit("shoot", { x, y });
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("click", handleClick);

    return () => {
      socket.off("updatePlayers");
      socket.off("updateProjectiles");
      socket.off("updateEnemies");
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("click", handleClick);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold mb-6">Shooter.io</h1>

      {/* Game Arena */}
      <div className="relative w-150 h-100 border border-gray-600 bg-black overflow-hidden">
        {
          Object.values(players)
            .filter(player => player.isAlive)
            .map((player) => (
              <div
                key={player.id}
                className={"absolute flex flex-col items-center"}
                style={{
                  left: player.x,
                  top: player.y,
                }}
              >
                {/* Player */}
                <div
                  className={`w-5 h-5 rounded-full 
                    ${player.id === socket.id ? "bg-green-400" : "bg-red-400"}`
                  }
                />

                {/* Health bar */}
                <div className="w-10 h-1 bg-gray-700 mt-1">
                  <div
                    className="h-full bg-green-400"
                    style={{ width: `${player.health}%` }}
                  />
                </div>
              </div>
            ))
        }

        {Object.values(projectiles).map((p) => (
          <div
            key={p.id}
            className="absolute w-2 h-2 bg-yellow-400 rounded-full"
            style={{
              left: p.x,
              top: p.y,
            }}
          />
        ))}

        {Object.values(enemies).map((enemy) => (
          <div
            key={enemy.id}
            className="absolute w-5 h-5 bg-purple-400 rounded-full"
            style={{
              left: enemy.x,
              top: enemy.y,
            }}
          />
        ))}
      </div>

      <div className="mt-6 w-75">
        <h3 className="text-lg font-semibold mb-2">Leaderboard</h3>

        {Object.values(players)
          .sort((a, b) => b.score - a.score)
          .map((p) => (
            <div key={p.id} className="flex justify-between text-sm">
              <span>{p.id.slice(0, 4)}</span>
              <span>{p.score}</span>
            </div>
          ))}
      </div>

      {/* Debug Info (temporary) */}
      <div className="mt-6 text-sm text-gray-400">
        <p>Players: {Object.keys(players).length}</p>
      </div>
    </div>
  );
}