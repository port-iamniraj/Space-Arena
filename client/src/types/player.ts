import type { PlayerState } from "@game/shared";

export type Player =
    PlayerState & {

        renderX?: number;

        renderY?: number;
    };