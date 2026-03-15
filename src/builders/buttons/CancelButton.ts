import { BaseButton, ButtonStyle } from "../../interfaces/application/Message";
import ComponentService from "../../services/application/ComponentService";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { i18n } from "../../utils/i18n/i18n";
import { InteractionEvent } from "../../interfaces/application/Event";
import { createGenericButton } from "./GenericButton";

export function createCancelButton(userId: string): BaseButton {
    return createGenericButton(new MultiLingualString(i18n.labels.common.cancel), ButtonStyle.SECONDARY, "🔻", userId, async (event: InteractionEvent) => {
        await event.editWithComponentAsync(ComponentService.createContent(new MultiLingualString(i18n.labels.common.cancel)));
    });
}