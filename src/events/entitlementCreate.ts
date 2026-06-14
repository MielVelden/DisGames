import { Entitlement, Events } from 'discord.js';
import ServerService from '../services/domain/ServerService';
import { getPremiumSkuId } from '../utils/application/PremiumAccess';

export default {
    name: Events.EntitlementCreate,

    async execute(entitlement: Entitlement): Promise<void> {
        if (!entitlement.guildId)
            return;

        if (entitlement.skuId !== getPremiumSkuId())
            return;

        await ServerService.handlePremiumGrantedAsync(entitlement.guildId);
    },
};
