import { Component, ButtonStyle } from "../../interfaces/application/Message";
import { PRIVACY_POLICY_URL } from "../../utils/constants/Links";
import ComponentService from "../../services/application/ComponentService";
import BannerService from "../../services/domain/BannerService";
import { ServersModel } from "../../interfaces/database/TableInterfaces";
import { createTitle } from "../../utils/helpers/Markdown";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { i18n } from "../../utils/i18n/i18n";

export async function createWelcomeContainerAsync(server?: ServersModel): Promise<Component[]> {
    const welcomeImage = await BannerService.getBaseBannerAsync('welcome', server);
    return [
        ComponentService.createImage(welcomeImage, false),
        ComponentService.createSeparator(),
        ComponentService.createContent(createTitle(new MultiLingualString(i18n.labels.common.welcome.title))),
        ComponentService.createContent(new MultiLingualString(i18n.labels.common.welcome.description)),
        ComponentService.createLinkButton({
            label: new MultiLingualString(i18n.commands.aboutme.labels.privacy),
            style: ButtonStyle.LINK,
            url: PRIVACY_POLICY_URL,
        }),
    ];
}