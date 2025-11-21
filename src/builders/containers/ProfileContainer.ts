import { Component, ComponentType, Container } from "../../interfaces/application/Message";
import { ProfileView } from "../../interfaces/view";
import { createInformationBlock } from "../../utils/helpers/Markdown";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { i18n } from "../../utils/i18n/i18n";

export function createProfileContainer(profile: ProfileView): Component {
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
            },
            {
                type: ComponentType.TEXT_DISPLAY,
                content: createProfileText(profile)
            }
        ]
    } as Container
}

function createProfileText(profile: ProfileView): MultiLingualString {
    return createInformationBlock([
        { key: new MultiLingualString(i18n.tables.users.fields.username), value: profile.Username },
        { key: new MultiLingualString(i18n.commands.profile.labels.globalUserRank), value: profile.UserRank.toString() },
        { key: new MultiLingualString(i18n.commands.profile.labels.globalPoints), value: profile.TotalPoints.toString() },
    ]);
}