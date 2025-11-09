import { Component, ComponentType, Container } from "../../interfaces/application/Message";
import { ProfileGameView } from "../../interfaces/view";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { i18n } from "../../utils/i18n/i18n";

export function createProfileGameContainer(profile: ProfileGameView): Component {
    return {
            type: ComponentType.CONTAINER,
            components: [
                {
                    type: ComponentType.TITLE,
                    content: new MultiLingualString(i18n.commands.profile.labels.title)
                },
                {
                    type: ComponentType.TEXT_DISPLAY,
                    content: new MultiLingualString(i18n.commands.profile.description)
                }
            ]
        } as Container
}