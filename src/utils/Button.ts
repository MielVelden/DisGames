import { InteractionEvent } from "../interfaces/application/Event";
import { ActionButton, ButtonStyle } from "../interfaces/application/Message";
import ComponentService from "../services/ComponentService";
import { i18n } from "./i18n/i18n";
import { MultiLingualString } from "./i18n/MultiLingualString";

export function createCancelButton(userId: string): ActionButton {
    return ComponentService.createButton(
        {
            style: ButtonStyle.DANGER,
            label: new MultiLingualString(i18n.common.cancel),
            emoji: "❌"
        },
        {
            userId: userId,
            handle: async (event: InteractionEvent) => {
                await event.editWithComponentAsync(ComponentService.createContent(new MultiLingualString(i18n.common.cancel)));
            }
        })
}

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

export function createDeleteButton(userId: string, handle: (event: InteractionEvent) => Promise<void>): ActionButton {
    return ComponentService.createButton(
        {
            label: new MultiLingualString(i18n.common.delete),
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

export function createAcceptButton(userId: string, handle: (event: InteractionEvent) => Promise<void>): ActionButton {
    return ComponentService.createButton(
        {
            label: new MultiLingualString(i18n.common.accept),
            style: ButtonStyle.SUCCESS,
            emoji: "✅"
        },
        {
            userId: userId,
            handle: async (event: InteractionEvent) => {
                await handle(event);
            }
        }
    )
}

export function createDenyButton(userId: string, handle: (event: InteractionEvent) => Promise<void>): ActionButton {
    return ComponentService.createButton(
        {
            label: new MultiLingualString(i18n.common.deny),
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