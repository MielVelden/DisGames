import { Component, ButtonStyle } from "../../interfaces/application/Message";
import {
    GameSettingType,
    EnumGameSetting,
    isBooleanGameSetting,
    isEnumGameSetting,
    isListGameSetting,
} from "../../interfaces/domain/GameSettings";
import { LanguageEnum } from "../../interfaces/enums";
import {
    GameSettingsContainerConfig,
    GameSettingsHandler,
    GameSettingsDisplayConfig
} from "../../interfaces/application/GameSetting";
import ComponentService from "../../services/application/ComponentService";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { i18n } from "../../utils/i18n/i18n";
import { ButtonInteractionEvent, InteractionEvent } from "../../interfaces/application/Event";
import { isMultiLingualString } from "../../interfaces/application/i18n";
import { createTitle } from "../../utils/helpers/Markdown";

export function createGameSettingsContainer(config: GameSettingsContainerConfig, handlers?: GameSettingsHandler): Component[] {
    const components: Component[] = [
        ComponentService.createContent(createTitle(new MultiLingualString(i18n.commands.games.settings.title))),
        ComponentService.createContent(new MultiLingualString(i18n.commands.games.settings.description)),
        ComponentService.createSeparator(),
    ];

    config.settingsSchema.forEach((setting) => {
        const currentValue = config.currentSettings[setting.key];

        components.push(ComponentService.createContent(createTitle(setting.label)));

        if (setting.description)
            components.push(ComponentService.createContent(setting.description));

        if (isBooleanGameSetting(setting)) {
            const boolValue = currentValue as boolean;
            components.push(ComponentService.createButton({
                style: boolValue ? ButtonStyle.SUCCESS : ButtonStyle.SECONDARY,
                label: new MultiLingualString(boolValue ? i18n.commands.games.settings.enabled : i18n.commands.games.settings.disabled),
            }, {
                userId: config.userId,
                handle: async (btnEvent: InteractionEvent) => {
                    if (handlers?.onBooleanClick)
                        await handlers.onBooleanClick(btnEvent as ButtonInteractionEvent, setting.key, boolValue);
                    else if (config.onSettingChange)
                        config.onSettingChange(btnEvent as ButtonInteractionEvent, setting.key, !boolValue);
                }
            }));
        }

        if (isEnumGameSetting(setting)) {
            const selectedOption = setting.options.find(opt => opt.value === currentValue);

            components.push(ComponentService.createButton({
                style: ButtonStyle.PRIMARY,
                label: selectedOption?.label || new MultiLingualString(i18n.commands.games.settings.unknown),
            }, {
                userId: config.userId,
                handle: async (btnEvent: InteractionEvent) => {
                    if (handlers?.onEnumClick)
                        await handlers.onEnumClick(btnEvent as ButtonInteractionEvent, setting.key, setting, currentValue);
                }
            }));
        }

        if (isListGameSetting(setting)) {
            const listValues = Array.isArray(currentValue)
                ? (currentValue as number[])
                : currentValue !== undefined && currentValue !== null
                    ? [Number(currentValue)]
                    : [];

            const selectedCount = setting.options.filter(option => {
                const optionValue = typeof option.value === "number" ? option.value : Number(option.value);
                return !Number.isNaN(optionValue) && listValues.includes(optionValue);
            }).length;

            components.push(ComponentService.createButton({
                style: selectedCount > 0 ? ButtonStyle.SUCCESS : ButtonStyle.SECONDARY,
                label: selectedCount > 0
                    ? i18n.commands.games.settings.selectedCount(selectedCount)
                    : new MultiLingualString(i18n.commands.games.settings.unknown),
            }, {
                userId: config.userId,
                handle: async (btnEvent: InteractionEvent) => {
                    if (handlers?.onListClick)
                        await handlers.onListClick(btnEvent as ButtonInteractionEvent, setting.key, setting, listValues);
                }
            }));
        }

        components.push(ComponentService.createSeparator());
    });

    if (config.onAccept || handlers?.onAcceptClick) {
        components.push(ComponentService.createButton({
            style: ButtonStyle.SUCCESS,
            label: new MultiLingualString(i18n.labels.common.accept),
        }, {
            userId: config.userId,
            handle: async (btnEvent: InteractionEvent) => {
                if (handlers?.onAcceptClick) {
                    await handlers.onAcceptClick(btnEvent as ButtonInteractionEvent);
                } else if (config.onAccept) {
                    config.onAccept();
                }
            }
        }));
    }

    if (config.onCancel || handlers?.onCancelClick) {
        components.push(ComponentService.createButton({
            style: ButtonStyle.SECONDARY,
            label: new MultiLingualString(i18n.labels.common.cancel),
        }, {
            userId: config.userId,
            handle: async (btnEvent) => {
                if (handlers?.onCancelClick) {
                    await handlers.onCancelClick(btnEvent as ButtonInteractionEvent);
                } else if (config.onCancel) {
                    config.onCancel();
                }
            }
        }));
    }

    return components;
}

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
