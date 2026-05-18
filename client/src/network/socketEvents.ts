import type { Socket } from "socket.io-client";
import type { RefObject } from "react";

import { addHitEffect } from "../effects/hitEffects";
import { addExplosionEffect } from "../effects/explosionEffects";

type RegisterSocketEventsParams = {
    socket: Socket;
    playersRef: RefObject<any>;
    missilesRef: RefObject<any>;
    projectilesRef: RefObject<any>;
    collectiblesRef: RefObject<any>;
    dropsRef: RefObject<any>;
    setPlayers: React.Dispatch<React.SetStateAction<any>>;
    setUpgradeConfig: React.Dispatch<React.SetStateAction<any>>;
    setIsConnecting: React.Dispatch<React.SetStateAction<boolean>>;
};

export function registerSocketEvents({
    socket,
    playersRef,
    missilesRef,
    projectilesRef,
    collectiblesRef,
    dropsRef,
    setPlayers,
    setUpgradeConfig,
    setIsConnecting,
}: RegisterSocketEventsParams) {

    socket.on("playerMovement", (serverPlayers) => {
        const current = playersRef.current;

        for (const id in serverPlayers) {
            const incoming = serverPlayers[id];
            const existing = current[id];

            if (!existing) {
                current[id] = {
                    ...incoming,
                    renderX: incoming.x,
                    renderY: incoming.y,
                };

                continue;
            }

            current[id] = {
                ...incoming,
                renderX: existing?.renderX ?? incoming.x,
                renderY: existing?.renderY ?? incoming.y,
            };
        }

        for (const id in current) {
            if (!serverPlayers[id]) delete current[id];
        }

        setPlayers({ ...current });

        if (Object.keys(serverPlayers).length > 0) {
            setIsConnecting(false);
        }
    });

    socket.on("updateProjectiles", (serverProjectiles) => {
        projectilesRef.current = serverProjectiles;
    });

    socket.on("updateMissiles", (serverMissiles) => {
        const current = missilesRef.current;

        for (const id in serverMissiles) {
            const incoming = serverMissiles[id];
            const existing = current[id];

            if (!existing) {
                incoming.renderX = incoming.x;
                incoming.renderY = incoming.y;

                current[id] = incoming;

                continue;
            }

            incoming.renderX = existing.renderX ?? incoming.x;
            incoming.renderY = existing.renderY ?? incoming.y;

            current[id] = incoming;
        }

        for (const id in current) {
            if (!serverMissiles[id]) delete current[id];
        }
    });

    socket.on("updateCollectibles", (serverCollectibles) => {
        collectiblesRef.current = serverCollectibles;
    });

    socket.on("updateDrops", (serverDrops) => {
        dropsRef.current = serverDrops;
    });

    socket.on("upgradeConfig", (config) => {
        setUpgradeConfig(config);
    });

    socket.on("hitEffect", (effect) => {
        addHitEffect(effect);
    });

    socket.on("missileExplosion", (effect) => {
        addExplosionEffect(effect);
    });
}