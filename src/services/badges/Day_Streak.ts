import { BadgeModule, BadgeTier, highestTier } from "../../interfaces/domain/Badge";
import { BadgeEnum, BadgeTriggerEnum } from "../../interfaces/enums";

const tiers: BadgeTier[] = [
    { level: 1, threshold: 7 },
    { level: 2, threshold: 30 },
    { level: 3, threshold: 100 },
];

export default {
    config: {
        id: BadgeEnum.DAY_STREAK,
        triggers: [BadgeTriggerEnum.AFTER_GAME],
        tiers,
    },
    
    async evaluate(ctx) {
        return highestTier(tiers, await ctx.streakDays());
    },
} as BadgeModule;
