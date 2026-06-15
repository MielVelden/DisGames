import { ComponentType, PremiumButton, ButtonStyle } from "../../interfaces/application/Message";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { EnvConfigEnum } from "../../interfaces/enums/application/EnvConfigEnum";
import { getPremiumSkuId } from "../../utils/application/PremiumAccess";

export function createProPurchaseButton(label: MultiLingualString, skuId?: string): PremiumButton {
    const resolved = (skuId ?? getPremiumSkuId()).trim();
    if (!resolved)
        return {
            type: ComponentType.BUTTON,
            style: ButtonStyle.PREMIUM,
            label
        };

    return {
        type: ComponentType.BUTTON,
        style: ButtonStyle.PREMIUM,
        sku_id: resolved,
        label
    };
}
