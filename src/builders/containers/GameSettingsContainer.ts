import { Component } from "../../interfaces/application/Message";
import { GameSettingType, EnumGameSetting } from "../../interfaces/domain/GameSettings";
import { LanguageEnum } from "../../interfaces/enums";
import { GameSettingsDisplayConfig } from "../../interfaces/application/GameSetting";
import ComponentService from "../../services/application/ComponentService";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { i18n } from "../../utils/i18n/i18n";
import { isMultiLingualString } from "../../interfaces/application/i18n";

export function createGameSettingsDisplay(config: GameSettingsDisplayConfig): Component[] {
    const components: Component[] = [];

    const ALL_LANGUAGES = Object.values(LanguageEnum).filter((v): v is LanguageEnum => typeof v === "number");

    const format = (label: string, status: string) => `> ${label}: **${status}**`;
    const mls = (label: MultiLingualString, status: string | boolean | MultiLingualString) => {
        const translations = {} as Record<LanguageEnum, string>;

        for (const lang of ALL_LANGUAGES) {
            const statusText = typeof status === "boolean"
                ? new MultiLingualString(status ? i18n.labels.common.enabled : i18n.labels.common.disabled).getMessage(lang)
                : isMultiLingualString(status)
                    ? status.getMessage(lang)
                    : status;
            translations[lang] = format(label.getMessage(lang), statusText);
        }

        return new MultiLingualString(translations);
    };

    config.settingsSchema.forEach((setting) => {
        const currentValue = config.settings[setting.key];
        let display: MultiLingualString | undefined;

        if (setting.type === GameSettingType.BOOLEAN) {
            const statusLabel = currentValue ? "Enabled" : "Disabled";
            display = mls(setting.label, statusLabel);
        } else if (setting.type === GameSettingType.ENUM) {
            const enumSetting = setting as EnumGameSetting;
            const option = enumSetting.options.find(opt => opt.value === currentValue);
            display = mls(setting.label, option?.label || new MultiLingualString(i18n.commands.games.settings.unknown));
        } else if (setting.type === GameSettingType.LIST) {
            const listValues = Array.isArray(currentValue)
                ? (currentValue as number[])
                : currentValue !== undefined && currentValue !== null
                    ? [Number(currentValue)]
                    : [];

            const selectedOptions = setting.options.filter(opt => {
                const optionValue = typeof opt.value === "number" ? opt.value : Number(opt.value);
                if (Number.isNaN(optionValue))
                    return false;
                return listValues.includes(optionValue);
            });

            const hasAny = selectedOptions.length > 0;
            const statusLabel = new MultiLingualString(hasAny ? i18n.labels.common.enabled : i18n.labels.common.disabled);

            const translations = {} as Record<LanguageEnum, string>;
            for (const lang of ALL_LANGUAGES) {
                const label = setting.label.getMessage(lang);
                translations[lang] = hasAny
                    ? format(label, `${statusLabel.getMessage(lang)} ${selectedOptions.map(opt => opt.label.getMessage(lang)).join(", ")}`)
                    : format(label, statusLabel.getMessage(lang));
            }

            display = new MultiLingualString(translations);
        }

        if (!display)
            return;

        components.push(ComponentService.createContent(display));
    });

    return components;
}
