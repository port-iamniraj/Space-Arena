type ExplosionEffect = {
    x: number;
    y: number;
    life: number;
};

const explosionEffects: ExplosionEffect[] = [];

export function addExplosionEffect(effect: Omit<ExplosionEffect, "life">) {
    explosionEffects.push({ ...effect, life: 14 });
}

export function getExplosionEffects() {
    return explosionEffects;
}