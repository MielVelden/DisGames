import { BadgeModule } from "../../interfaces/domain/Badge";
import { BadgeEnum, BadgeTriggerEnum } from "../../interfaces/enums";

export default {
    config: {
        id: BadgeEnum.FIRST_GAME,
        triggers: [BadgeTriggerEnum.AFTER_GAME],
        tiers: [{ level: 1, threshold: 1 }],
    },

    async evaluate(ctx) {
        const played = await ctx.gamesPlayed();
        return played >= 1 ? 1 : null;
    },
} as BadgeModule;
