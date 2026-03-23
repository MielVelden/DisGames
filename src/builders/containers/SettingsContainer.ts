import { ActionButton, Component } from "../../interfaces/application/Message";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { i18n } from "../../utils/i18n/i18n";
import ComponentService from "../../services/application/ComponentService";
import { createTitle } from "../../utils/helpers/Markdown";

export function createSettingsContainer(actions: ActionButton[]): Component[] {
    return [
        ComponentService.createContent(createTitle(new MultiLingualString(i18n.commands.settings.labels.title))),
        ComponentService.createContent(new MultiLingualString(i18n.commands.settings.labels.description)),
        ...actions,
    ] as Component[];
}