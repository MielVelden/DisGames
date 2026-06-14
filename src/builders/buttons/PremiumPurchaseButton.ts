import { ComponentType, PremiumButton, ButtonStyle } from "../../interfaces/application/Message";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { EnvConfigEnum } from "../../interfaces/enums/application/EnvConfigEnum";
import { getPremiumSkuId } from "../../utils/application/PremiumAccess";

export function createProPurchaseButton(label: MultiLingualString, skuId?: string): PremiumButton {
    const resolved = (skuId ?? getPremiumSkuId()).trim();
    if (!resolved)
        throw new Error(`${EnvConfigEnum.DISCORD_PREMIUM_SKU_ID} is not set and no skuId was passed`);

    return {
        type: ComponentType.BUTTON,
        style: ButtonStyle.PREMIUM,
        sku_id: resolved,
        label
    };
}
