import { InteractionEvent } from "../../interfaces/application/Event";
import { ActionButton, ButtonStyle } from "../../interfaces/application/Message";
import ComponentService from "../../services/application/ComponentService";
import { i18n } from "../../utils/i18n/i18n";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";

export function createDeleteButton(userId: string, handle: (event: InteractionEvent) => Promise<void>): ActionButton {
    return ComponentService.createButton(
        {
            label: new MultiLingualString(i18n.labels.common.delete),
            style: ButtonStyle.DANGER,
            emoji: "🗑️"
        },
        {
            userId: userId,
            handle: async (event: InteractionEvent) => {
                await handle(event);
            }
        }
    )
}