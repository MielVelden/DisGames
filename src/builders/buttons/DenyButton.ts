import { InteractionEvent } from "../../interfaces/application/Event";
import ComponentService from "../../services/application/ComponentService";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { i18n } from "../../utils/i18n/i18n";
import { ActionButton, ButtonStyle } from "../../interfaces/application/Message";

export function createDenyButton(userId: string, handle: (event: InteractionEvent) => Promise<void>): ActionButton {
    return ComponentService.createButton(
        {
            label: new MultiLingualString(i18n.labels.common.deny),
            style: ButtonStyle.SECONDARY,
            emoji: "❌"
        },
        {
            userId: userId,
            handle: async (event: InteractionEvent) => {
                await handle(event);
            }
        }
    )
}   