import { Component, ComponentType, Container } from "../../interfaces/application/Message";
import { ProfileView } from "../../interfaces/view";
import MediaService from "../../services/application/MediaService";
import { createBlock, createBlockList, createTitle } from "../../utils/helpers/Markdown";
import { createMultiLingualString, MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { i18n } from "../../utils/i18n/i18n";

export function createProfileContainer(profile: ProfileView): Component {
    const profileContainerImage = MediaService.getProfileContainerImage();

    return {
        type: ComponentType.CONTAINER,
        components: [
            {
                type: ComponentType.MEDIA_GALLERY,
                items: [
                    {
                        media: profileContainerImage
                    }
                ]
            },
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
                content: createTitle(new MultiLingualString(i18n.commands.profile.labels.username))
            },
            {
                type: ComponentType.TEXT_DISPLAY,
                content: createMultiLingualString(createBlock(profile.Username))
            },
            {
                type: ComponentType.TEXT_DISPLAY,
                content: createBlock(i18n.commands.profile.labels.joinedAt(profile.JoinedAt))
            },
            {
                type: ComponentType.SEPARATOR,
            },
            {
                type: ComponentType.TEXT_DISPLAY,
                content: createTitle(new MultiLingualString(i18n.commands.profile.labels.badges))
            },
            {
                type: ComponentType.TEXT_DISPLAY,
                content: createBlockList(["Early Bird", "Tester"])
            },
            {
                type: ComponentType.SEPARATOR,
            },
            {
                type: ComponentType.TEXT_DISPLAY,
                content: createBlock(i18n.commands.profile.labels.globalUserRank(profile.UserRank))
            },
            {
                type: ComponentType.TEXT_DISPLAY,
                content: createBlock(i18n.commands.profile.labels.globalPoints(profile.TotalPoints))
            }
        ]
    } as Container
}