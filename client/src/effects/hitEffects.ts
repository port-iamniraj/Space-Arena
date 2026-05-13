type HitEffect = {
    x: number;
    y: number;
    life: number;
    type: | "normal" | "shield";
};

const hitEffects: HitEffect[] = [];

export function addHitEffect(effect: Omit<HitEffect, "life">) {
    hitEffects.push({ ...effect, life: 8 });
}

export function getHitEffects() {
    return hitEffects;
}