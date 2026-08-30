import { Entitlement, Events } from 'discord.js';
import DiscordPremiumService from '../services/discord/DiscordPremiumService';
import { getPremiumSkuId } from '../utils/application/PremiumAccess';

export default {
    name: Events.EntitlementCreate,

    async execute(entitlement: Entitlement): Promise<void> {
        if (!entitlement.guildId)
            return;

        if (entitlement.skuId !== getPremiumSkuId())
            return;

        await DiscordPremiumService.handlePremiumGrantedAsync(entitlement.guildId);
    },
};
