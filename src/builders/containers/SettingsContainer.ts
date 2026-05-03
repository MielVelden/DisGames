import { ActionButton, Component } from "../../interfaces/application/Message";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { i18n } from "../../utils/i18n/i18n";
import ComponentService from "../../services/application/ComponentService";
import { createTitle } from "../../utils/helpers/Markdown";
import MediaService from "../../services/application/MediaService";
import { SettingsResponse } from "../../interfaces/view/Settings";

export function createSettingsContainer(settings: SettingsResponse, actions: ActionButton[]): Component[] {
    const settingsContainerImage = MediaService.getBaseImage('settings');
    const language = new MultiLingualString(i18n.languages[settings.LanguageEnum]).getMessage(settings.LanguageEnum);

    return [
        ComponentService.createImage(settingsContainerImage, false),
        ComponentService.createContent(createTitle(new MultiLingualString(i18n.commands.settings.labels.title))),
        ComponentService.createContent(new MultiLingualString(i18n.commands.settings.labels.description)),
        ComponentService.createContent(i18n.commands.settings.labels.serverName(settings.ServerName)),
        ComponentService.createContent(i18n.commands.settings.labels.currentLanguage(language)),
        ComponentService.createContent(i18n.commands.settings.labels.gamesEnabled(settings.GamesEnabled)),
        ComponentService.createSeparator(),
        ...actions,
    ] as Component[];
}