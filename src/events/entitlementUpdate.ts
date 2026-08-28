import { Entitlement, Events } from 'discord.js';
import DiscordPremiumService from '../services/discord/DiscordPremiumService';
import { getPremiumSkuId } from '../utils/application/PremiumAccess';

export default {
    name: Events.EntitlementUpdate,

    async execute(oldEntitlement: Entitlement | null, newEntitlement: Entitlement): Promise<void> {
        if (!newEntitlement.guildId)
            return;

        if (newEntitlement.skuId !== getPremiumSkuId())
            return;

        if (newEntitlement.endsTimestamp !== null)
            await DiscordPremiumService.handlePremiumRevokedAsync(newEntitlement.guildId);
    },
};
