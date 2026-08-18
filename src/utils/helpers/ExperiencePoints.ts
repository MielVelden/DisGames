// Quadratic XP curve: total XP for level n = BASE * n^2. Cost per level = BASE * (2n+1),
// so each level is linearly harder than the last — L0→1 costs 160 XP, L1→2 costs 480, L10→11 costs 3360.

import { UserLevelData } from "../../interfaces/domain";

// No ceiling; achievements and bonuses act as spikes on top of regular game XP.
const BASE = 160;

export function calculateUserLevel(experiencePoints: number): UserLevelData {
    const currentLevel = Math.floor(Math.sqrt(experiencePoints / BASE));
    const xpStart = BASE * currentLevel * currentLevel;
    const xpEnd = BASE * (currentLevel + 1) * (currentLevel + 1);
    const progress = Math.round(((experiencePoints - xpStart) / (xpEnd - xpStart)) * 10000) / 100;

    return {
        currentLevel,
        xpNow: experiencePoints,
        xpMax: xpEnd,
        progress
    };
}
