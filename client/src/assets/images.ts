import { loadImage, loadImages } from "../utils/imageLoader";

// ============================================
// SKINS
// ============================================

export const skinImages =
    loadImages({
        default: "/skins/default.png",
        fighter: "/skins/fighter.png",
        interceptor: "/skins/interceptor.png",
    });

// ============================================
// WEAPONS
// ============================================

export const laserImage =
    loadImage(
        "/weapons/laserBlue.png"
    );

export const missileImage =
    loadImage(
        "/weapons/missile.png"
    );

// ============================================
// EFFECTS
// ============================================

export const bodyHitImage =
    loadImage(
        "/effects/hit.png"
    );

export const shieldHitImage =
    loadImage(
        "/effects/shieldHit.png"
    );

export const shieldImage =
    loadImage(
        "/effects/shield.png"
    );

export const thrustImage =
    loadImage(
        "/effects/thrust.png"
    );

export const explosionImage =
    loadImage(
        "/effects/explosion.png"
    );

// ============================================
// DROPS
// ============================================

export const dropImages =
    loadImages({
        health: "/drops/health.png",
        shield: "/drops/shield.png",
    });