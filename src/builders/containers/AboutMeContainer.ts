import { Component, ButtonStyle } from "../../interfaces/application/Message";
import ComponentService from "../../services/application/ComponentService";
import MediaService from "../../services/application/MediaService";
import { createTitle } from "../../utils/helpers/Markdown";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { i18n } from "../../utils/i18n/i18n";

export function createAboutMeContainer(inviteUrl: string, githubUrl: string, version: string): Component[] {
    const image = MediaService.getBaseImage("aboutme");
    const title = ComponentService.createContent(createTitle(new MultiLingualString(i18n.commands.aboutme.labels.title)));
    const description = ComponentService.createContent(new MultiLingualString(i18n.commands.aboutme.labels.description));
    const inviteButton = ComponentService.createLinkButton({
        label: new MultiLingualString(i18n.commands.aboutme.labels.invite),
        style: ButtonStyle.LINK,
        url: inviteUrl,
    });
    const githubButton = ComponentService.createLinkButton({
        label: new MultiLingualString(i18n.commands.aboutme.labels.github),
        style: ButtonStyle.LINK,
        url: githubUrl,
    });
    const versionLabel = ComponentService.createButton({
        label: i18n.commands.aboutme.labels.version(version),
        style: ButtonStyle.SECONDARY,
        disabled: true,
    });

    return [
        ComponentService.createImage(image, false),
        ComponentService.createSeparator(),
        title,
        description,
        inviteButton,
        githubButton,
        versionLabel,
    ];
}
