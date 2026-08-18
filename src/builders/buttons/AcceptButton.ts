import { InteractionEvent } from "../../interfaces/application/Event";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { i18n } from "../../utils/i18n/i18n";
import { ActionButton, ButtonStyle } from "../../interfaces/application/Message";
import { createGenericButton } from "./GenericButton";

export function createAcceptButton(userId: string, handle: (event: InteractionEvent) => Promise<void>): ActionButton {
    return createGenericButton(new MultiLingualString(i18n.labels.common.accept), ButtonStyle.SECONDARY, "🔹", userId, false, handle);
}