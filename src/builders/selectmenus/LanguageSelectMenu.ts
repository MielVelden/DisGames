import { ComponentType, SelectMenu, SelectOption } from "../../interfaces/application/Message";
import ComponentService from "../../services/application/ComponentService";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { i18n } from "../../utils/i18n/i18n";
import { HandlerConfig } from "../../interfaces/application/Event";
import { LanguageEnum } from "../../interfaces/enums";
import { MetadataKeyEnum } from "../../interfaces/enums/application/MetadataKeyEnum";
import { getEnumProperty } from "../../utils/helpers/EnumMetadata";

export function createLanguageSelectMenu(handlerConfig?: HandlerConfig): SelectMenu {
    return ComponentService.createSelectMenu({
        custom_id: "language",
        type: ComponentType.STRING_SELECT,
        question: new MultiLingualString(i18n.commands.settings.labels.changeLanguage),
        placeholder: new MultiLingualString(i18n.commands.settings.labels.clickHereToChangeLanguage),
        options: Object.keys(LanguageEnum)
            .filter(key => isNaN(Number(key)))
            .map((key: string): SelectOption => {
                const language = LanguageEnum[key as keyof typeof LanguageEnum];
                return {
                    emoji: getEnumProperty(LanguageEnum, language, MetadataKeyEnum.Emoji) as string,
                    label: new MultiLingualString(i18n.languages[language]),
                    value: key,
                };
            })
    }, handlerConfig);
}