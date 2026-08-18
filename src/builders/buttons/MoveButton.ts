import { InteractionEvent } from "../../interfaces/application/Event";
import { ActionButton, ButtonStyle } from "../../interfaces/application/Message";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { i18n } from "../../utils/i18n/i18n";
import { createGenericButton } from "./GenericButton";

export function createMoveButton(userId: string, handle: (event: InteractionEvent) => Promise<void>): ActionButton {
    return createGenericButton(new MultiLingualString(i18n.commands.games.buttons.move), ButtonStyle.SECONDARY, "🔸", userId, false, handle);
}