import { ComponentType, SelectMenu } from "../../interfaces/application/Message";
import ComponentService from "../../services/application/ComponentService";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { i18n } from "../../utils/i18n/i18n";
import { HandlerConfig } from "../../interfaces/application/Event";
import { LanguageEnum } from "../../interfaces/enums";
import { getEnumAsList } from "../../utils/helpers/Enum";

export function createLanguageSelectMenu(handlerConfig?: HandlerConfig): SelectMenu {
    return ComponentService.createSelectMenu({
        custom_id: "language",
        type: ComponentType.STRING_SELECT,
        question: new MultiLingualString(i18n.commands.settings.labels.changeLanguage),
        placeholder: new MultiLingualString(i18n.commands.settings.labels.changeLanguage),
        options: [
            {
                label: new MultiLingualString(i18n.languages[LanguageEnum.EN]),
                value: 'en',
            },
            {
                label: new MultiLingualString(i18n.languages[LanguageEnum.NL]),
                value: 'nl',
            }
        ]
    }, handlerConfig);
}