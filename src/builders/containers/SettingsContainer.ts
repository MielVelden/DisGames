import { ActionButton, Component, ComponentType, Container } from "../../interfaces/application/Message";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { i18n } from "../../utils/i18n/i18n";

export function createSettingsContainer(actions: ActionButton[]): Component[] {
    return [
        {
            type: ComponentType.CONTAINER,
            components: [
                {
                    type: ComponentType.TITLE,
                    content: new MultiLingualString(i18n.commands.settings.labels.title)
                },
                {
                    type: ComponentType.TEXT_DISPLAY,
                    content: new MultiLingualString(i18n.commands.settings.labels.description)
                }
            ]
        } as Container,
        ...actions
    ] as Component[];
}