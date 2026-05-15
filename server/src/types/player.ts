import type { PlayerState } from "@game/shared";

export type Player =
    PlayerState & {

        dxShoot: number;

        dyShoot: number;

        shotTick: number;

        baseStats: {
            speed: number;

            fireRate: number;

            damage: number;
        };
    };