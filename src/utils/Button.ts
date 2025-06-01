import { InteractionEvent } from "../interfaces/application/Event";
import { ActionButton, ButtonStyle } from "../interfaces/application/Message";
import ComponentService from "../services/ComponentService";
import { i18n } from "./i18n/i18n";
import { MultiLingualString } from "./i18n/MultiLangualString";

export function createCancelButton(userId: string): ActionButton {
    return ComponentService.createButton(
        {
            style: ButtonStyle.DANGER,
            label: "Cancel",
            emoji: "❌"
        },
        {
            userId: userId,
            handle: async (event: InteractionEvent) => {
                await event.clearComponentsAsync();
                event.addComponentAsync(ComponentService.createContent(new MultiLingualString(i18n.common.cancel)));
                await event.editAsync();
            }
        })
}

export function createMoveButton(userId: string, handle: (event: InteractionEvent) => Promise<void>): ActionButton {
    return ComponentService.createButton(
        {
            label: "Move to this channel",
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
