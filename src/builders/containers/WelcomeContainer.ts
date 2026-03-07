import { Component, Separator } from "../../interfaces/application/Message";
import ComponentService from "../../services/application/ComponentService";
import MediaService from "../../services/application/MediaService";
import { createTitle } from "../../utils/helpers/Markdown";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { i18n } from "../../utils/i18n/i18n";

export function createWelcomeContainer(): Component[] {
    const welcomeImage = MediaService.getBaseImage('welcome');
    return [
        ComponentService.createImage(welcomeImage, false),
        ComponentService.createSeparator(),
        ComponentService.createContent(createTitle(new MultiLingualString(i18n.labels.common.welcome.title))),
        ComponentService.createContent(new MultiLingualString(i18n.labels.common.welcome.message))
    ];
}