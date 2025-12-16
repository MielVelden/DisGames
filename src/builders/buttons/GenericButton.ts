import { InteractionEvent } from "../../interfaces/application/Event";
import ComponentService from "../../services/application/ComponentService";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { ActionButton, ButtonStyle } from "../../interfaces/application/Message";

export function createGenericButton(label: MultiLingualString, style: Exclude<ButtonStyle, ButtonStyle.LINK | ButtonStyle.PREMIUM>, emoji: string, userId: string, handle: (event: InteractionEvent) => Promise<void>): ActionButton {
    return ComponentService.createButton(
        {
            label: label,
            style: style,
            emoji: emoji
        },
        {
            userId: userId,
            handle: async (event: InteractionEvent) => {
                await handle(event);
            }
        }
    )
}   