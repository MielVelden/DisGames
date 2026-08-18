import { Entitlement, Events } from 'discord.js';
import ServerService from '../services/domain/ServerService';
import { getPremiumSkuId } from '../utils/application/PremiumAccess';

export default {
    name: Events.EntitlementUpdate,

    async execute(oldEntitlement: Entitlement | null, newEntitlement: Entitlement): Promise<void> {
        if (!newEntitlement.guildId)
            return;

        if (newEntitlement.skuId !== getPremiumSkuId())
            return;

        if (newEntitlement.endsTimestamp !== null)
            await ServerService.handlePremiumRevokedAsync(newEntitlement.guildId);
    },
};
