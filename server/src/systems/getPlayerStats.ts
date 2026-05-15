import type { Player } from "../types/player";

export function getPlayerStats(player: Player) {
    return {
        speed: player.baseStats.speed + player.upgrades.speed,

        fireRate: Math.max(
            1,
            player.baseStats.fireRate - player.upgrades.fireRate
        ),

        damage: player.baseStats.damage + player.upgrades.damage,
    };
}