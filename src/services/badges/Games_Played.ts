import { BadgeModule, BadgeTier, highestTier } from "../../interfaces/domain/Badge";
import { BadgeEnum, BadgeTriggerEnum } from "../../interfaces/enums";

const tiers: BadgeTier[] = [
    { level: 1, threshold: 10 },
    { level: 2, threshold: 50 },
    { level: 3, threshold: 250 },
];

export default {
    config: {
        id: BadgeEnum.GAMES_PLAYED,
        triggers: [BadgeTriggerEnum.AFTER_GAME],
        tiers,
    },

    async evaluate(ctx) {
        return highestTier(tiers, await ctx.gamesPlayed());
    },
} as BadgeModule;
