import { BadgeModule, BadgeTier, highestTier } from "../../interfaces/domain/Badge";
import { BadgeEnum, BadgeTriggerEnum } from "../../interfaces/enums";

const tiers: BadgeTier[] = [
    { level: 1, threshold: 100 },
    { level: 2, threshold: 200 },
    { level: 3, threshold: 500 },
];

export default {
    config: {
        id: BadgeEnum.VETERAN,
        triggers: [BadgeTriggerEnum.AFTER_GAME],
        tiers,
    },

    async evaluate(ctx) {
        return highestTier(tiers, await ctx.accountAgeDays());
    },
} as BadgeModule;
