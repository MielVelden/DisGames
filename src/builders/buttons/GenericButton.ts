import { InteractionEvent } from "../../interfaces/application/Event";
import ComponentService from "../../services/application/ComponentService";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { ActionButton, ButtonStyle } from "../../interfaces/application/Message";
import { getPremiumSkuId } from "../../utils/application/PremiumAccess";

export function createGenericButton(label: MultiLingualString, style: Exclude<ButtonStyle, ButtonStyle.LINK | ButtonStyle.PREMIUM>, emoji: string, userId: string, isPremiumButton: boolean, handle: (event: InteractionEvent) => Promise<void>): ActionButton {
    // TODO: Make premium skuId a parameter instead of using getPremiumSkuId() to get the skuId
    const premiumSkuId = isPremiumButton ? getPremiumSkuId() : undefined;
    
    return ComponentService.createButton(
        {
            label: label,
            style: style,
            emoji: emoji,
            premiumSkuId: premiumSkuId,
        },
        {
            userId: userId,
            handle: async (event: InteractionEvent) => {
                await handle(event);
            }
        }
    )
}   