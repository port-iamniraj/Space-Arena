import type { Player } from "../types/player";

export function findNearestTarget(
    player: Player,
    players: Record<string, Player>,
    range: number
): string | null {

    let nearestId: string | null = null;

    let nearestDist = Infinity;

    for (const id in players) {

        const enemy = players[id];

        if (enemy.id === player.id) continue;

        if (!enemy.isAlive) continue;

        const dist = Math.hypot(
            enemy.x - player.x,
            enemy.y - player.y
        );

        if (dist > range) continue;

        if (dist < nearestDist) {
            nearestDist = dist;
            nearestId = id;
        }
    }

    return nearestId;
}