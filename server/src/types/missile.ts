export type Missile = {
    id: number;

    x: number;
    y: number;

    velocity: {
        x: number;
        y: number;
    };

    angle: number;

    ownerId: string;

    life: number;

    targetId: string | null;
};