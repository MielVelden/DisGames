import { Entitlement } from "discord.js";
import { discordClient } from "../..";

class DiscordTestEntitlementService {
    public async createUserTestEntitlementAsync(skuId: string, userId: string): Promise<Entitlement> {
        if (!discordClient.isReady())
            throw new Error("Client not ready");
        return discordClient.application.entitlements.createTest({
            sku: skuId,
            user: userId
        });
    }

    public async createGuildTestEntitlementAsync(skuId: string, guildId: string): Promise<Entitlement> {
        if (!discordClient.isReady())
            throw new Error("Client not ready");
        return discordClient.application.entitlements.createTest({
            sku: skuId,
            guild: guildId
        });
    }

    public async deleteTestEntitlementAsync(entitlementId: string): Promise<void> {
        if (!discordClient.isReady())
            throw new Error("Client not ready");
        await discordClient.application.entitlements.deleteTest(entitlementId);
    }
}

export default new DiscordTestEntitlementService();
