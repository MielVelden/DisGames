import { ServersModel } from "../../interfaces/database/TableInterfaces";
import { EnvConfigEnum } from "../../interfaces/enums/application/EnvConfigEnum";
import { MultiLingualString } from "../i18n/MultiLingualString";
import { getConfigValue } from "./Config";

export const PREMIUM_NAME = "Pro";

export function getPremiumSkuId(): string {
    return String(getConfigValue(EnvConfigEnum.DISCORD_PREMIUM_SKU_ID)).trim();
}

export function isPremiumEnabled(): boolean {
    return Boolean(getPremiumSkuId());
}

// In-memory kill switch for the purchase button, toggled via the owner-only /premium
// command. Deliberately process-lifetime only: a restart always fails back to enabled
// rather than leaving the button stuck hidden after an incident.
let purchaseButtonEnabled = true;

export function isPurchaseButtonEnabled(): boolean {
    return purchaseButtonEnabled;
}

export function setPurchaseButtonEnabled(enabled: boolean): void {
    purchaseButtonEnabled = enabled;
}

export function isServerPremium(server: ServersModel): boolean {
    return server.IsPremium;
}

export function addPremiumSuffix(message: MultiLingualString): MultiLingualString {
    return message.changeText(text => `${text} (${PREMIUM_NAME})`);
}
