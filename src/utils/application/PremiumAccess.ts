import { InteractionEvent } from "../../interfaces/application/Event";
import { ServersModel } from "../../interfaces/database/TableInterfaces";
import { EnvConfigEnum } from "../../interfaces/enums/application/EnvConfigEnum";
import { getConfigValue } from "./Config";

export function getPremiumSkuId(): string {
    return String(getConfigValue(EnvConfigEnum.DISCORD_PREMIUM_SKU_ID)).trim();
}

export function isPremiumEnabled(): boolean {
    return Boolean(getPremiumSkuId());
}

export function hasPremiumAccess(event: InteractionEvent, skuId: string): boolean {
    if (!getConfigValue(EnvConfigEnum.IS_PRODUCTION))
        return true;

    if (!skuId)
        return false;

    return event.hasEntitlementForSku(skuId);
}

export function isServerPremium(server: ServersModel): boolean {
    // if (!getConfigValue(EnvConfigEnum.IS_PRODUCTION))
    //     return true;
    return server.IsPremium;
}
