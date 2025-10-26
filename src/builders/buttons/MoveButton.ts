import { InteractionEvent } from "../../interfaces/application/Event";
import { ActionButton, ButtonStyle } from "../../interfaces/application/Message";
import ComponentService from "../../services/application/ComponentService";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { i18n } from "../../utils/i18n/i18n";

export function createMoveButton(userId: string, handle: (event: InteractionEvent) => Promise<void>): ActionButton {
    return ComponentService.createButton(
        {
            label: new MultiLingualString(i18n.commands.games.buttons.move),
            style: ButtonStyle.SECONDARY,
        },
        {
            userId: userId,
            handle: async (event: InteractionEvent) => {
                await handle(event);
            }
        }
    )
}   