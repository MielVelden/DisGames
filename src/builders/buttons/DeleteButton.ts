import { InteractionEvent } from "../../interfaces/application/Event";
import { ActionButton, ButtonStyle } from "../../interfaces/application/Message";
import { createGenericButton } from "./GenericButton";
import { i18n } from "../../utils/i18n/i18n";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";

export function createDeleteButton(userId: string, handle: (event: InteractionEvent) => Promise<void>): ActionButton {
    return createGenericButton(new MultiLingualString(i18n.labels.common.delete), ButtonStyle.SECONDARY, "🔺", userId, false, handle);
}