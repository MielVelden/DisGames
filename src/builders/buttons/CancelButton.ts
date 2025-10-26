import { BaseButton, ButtonStyle } from "../../interfaces/application/Message";
import ComponentService from "../../services/application/ComponentService";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { i18n } from "../../utils/i18n/i18n";
import { InteractionEvent } from "../../interfaces/application/Event";

export function createCancelButton(userId: string): BaseButton {
    return ComponentService.createButton(
        {
            style: ButtonStyle.DANGER,
            label: new MultiLingualString(i18n.labels.common.cancel),
            emoji: "❌"
        },
        {
            userId: userId,
            handle: async (event: InteractionEvent) => {
                await event.editWithComponentAsync(ComponentService.createContent(new MultiLingualString(i18n.labels.common.cancel)));
            }
        })
}