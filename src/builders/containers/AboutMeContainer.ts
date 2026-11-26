import { Component, ButtonStyle } from "../../interfaces/application/Message";
import ComponentService from "../../services/application/ComponentService";
import BannerService from "../../services/domain/BannerService";
import { ServersModel } from "../../interfaces/database/TableInterfaces";
import { createTitle } from "../../utils/helpers/Markdown";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { i18n } from "../../utils/i18n/i18n";

export async function createAboutMeContainerAsync(inviteUrl: string, githubUrl: string, privacyUrl: string, version: string, server?: ServersModel): Promise<Component[]> {
    const image = await BannerService.getBaseBannerAsync("aboutme", server);
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
    const privacyButton = ComponentService.createLinkButton({
        label: new MultiLingualString(i18n.commands.aboutme.labels.privacy),
        style: ButtonStyle.LINK,
        url: privacyUrl,
    });
    const versionLabel =ComponentService.createButton({
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
        privacyButton,
        versionLabel,
    ];
}
