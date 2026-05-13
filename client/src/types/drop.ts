export type Drop = {
    id: number;

    x: number;
    y: number;

    type:
    | "health"
    | "shield";
};