import { BadgeModule, BadgeTier, highestTier } from "../../interfaces/domain/Badge";
import { BadgeEnum, BadgeTriggerEnum } from "../../interfaces/enums";

const tiers: BadgeTier[] = [
    { level: 1, threshold: 500 },
    { level: 2, threshold: 5_000 },
    { level: 3, threshold: 50_000 },
];

export default {
    config: {
        id: BadgeEnum.POINT_COLLECTOR,
        triggers: [BadgeTriggerEnum.AFTER_GAME],
        tiers,
    },

    async evaluate(ctx) {
        return highestTier(tiers, await ctx.totalPoints());
    },
} as BadgeModule;
