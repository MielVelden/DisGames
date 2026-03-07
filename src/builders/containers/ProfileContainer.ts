import { Component } from "../../interfaces/application/Message";
import { ProfileResponse } from "../../interfaces/view";
import ComponentService from "../../services/application/ComponentService";
import MediaService from "../../services/application/MediaService";
import { createBlock, createBlockList, createTitle } from "../../utils/helpers/Markdown";
import { createMultiLingualString, MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { i18n } from "../../utils/i18n/i18n";

export function createProfileContainer(profile: ProfileResponse): Component[] {
    const profileContainerImage = MediaService.getBaseImage('profile');

    return [
        ComponentService.createImage(profileContainerImage, false),
        ComponentService.createContent(createTitle(new MultiLingualString(i18n.commands.profile.labels.title))),
        ComponentService.createContent(new MultiLingualString(i18n.commands.profile.description)),
        ComponentService.createContent(createTitle(new MultiLingualString(i18n.commands.profile.labels.username))),
        ComponentService.createContent(createMultiLingualString(createBlock(profile.Username))),
        ComponentService.createContent(createBlock(i18n.commands.profile.labels.joinedAt(profile.JoinedAt))),
        ComponentService.createSeparator(),
        ComponentService.createContent(createTitle(new MultiLingualString(i18n.commands.profile.labels.badges))),
        ComponentService.createContent(createBlockList(["Early Bird", "Tester"])),
        ComponentService.createSeparator(),
        ComponentService.createContent(createBlock(i18n.commands.profile.labels.globalUserRank(profile.UserRank))),
        ComponentService.createContent(createBlock(i18n.commands.profile.labels.globalPoints(profile.TotalPoints))),
    ];
}
