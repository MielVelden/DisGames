import { BadgeModule, BadgeTier, highestTier } from "../../interfaces/domain/Badge";
import { BadgeEnum, BadgeTriggerEnum } from "../../interfaces/enums";

const tiers: BadgeTier[] = [
    { level: 1, threshold: 5 },
    { level: 2, threshold: 10 },
    { level: 3, threshold: 20 },
];

export default {
    config: {
        id: BadgeEnum.WORLD_TRAVELER,
        triggers: [BadgeTriggerEnum.AFTER_GAME],
        tiers,
    },

    async evaluate(ctx) {
        return highestTier(tiers, await ctx.distinctServers());
    },
} as BadgeModule;
