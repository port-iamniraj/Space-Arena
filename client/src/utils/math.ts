export function normalize(
    dx: number,
    dy: number
) {
    const length = Math.hypot(dx, dy);

    if (length === 0) {
        return {
            dx: 0,
            dy: 0,
        };
    }

    return {
        dx: dx / length,
        dy: dy / length,
    };
}