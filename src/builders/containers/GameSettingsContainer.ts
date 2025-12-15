import { Component, ComponentType, Container, TextDisplay, Title, Separator } from "../../interfaces/application/Message";
import { ButtonStyle } from "../../interfaces/application/Message";
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
import { ButtonInteractionEvent } from "../../interfaces/application/Event";

export class GameSettingsContainer {

    static createInteractiveContainer(config: GameSettingsContainerConfig, handlers?: GameSettingsHandler): Container {
        const components: Component[] = [];

        // Add title
        components.push({
            type: ComponentType.TITLE,
            content: new MultiLingualString(i18n.commands.games.settings.title)
        } as Title);

        components.push({
            type: ComponentType.TEXT_DISPLAY,
            content: new MultiLingualString(i18n.commands.games.settings.description)
        } as TextDisplay);

        // Add separator
        components.push({
            type: ComponentType.SEPARATOR,
            divider: true,
            spacing: 1
        } as Separator);

        // Create settings components
        config.settingsSchema.forEach((setting) => {
            const currentValue = config.currentSettings[setting.key];

            // Setting title
            components.push({
                type: ComponentType.TITLE,
                content: setting.label
            } as Title);

            // Setting description
            if (setting.description) {
                components.push({
                    type: ComponentType.TEXT_DISPLAY,
                    content: setting.description
                } as TextDisplay);
            }

            if (isBooleanGameSetting(setting)) {
                const boolValue = currentValue as boolean;
                components.push(ComponentService.createButton({
                    style: boolValue ? ButtonStyle.SUCCESS : ButtonStyle.SECONDARY,
                    label: new MultiLingualString(boolValue ? i18n.commands.games.settings.enabled : i18n.commands.games.settings.disabled),
                }, {
                    userId: config.userId,
                    handle: async (btnEvent: any) => {
                        if (handlers?.onBooleanClick)
                            await handlers.onBooleanClick(btnEvent, setting.key, boolValue);
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
                    handle: async (btnEvent: any) => {
                        if (handlers?.onEnumClick)
                            await handlers.onEnumClick(btnEvent, setting.key, setting, currentValue);
                    }
                }));
            }
            if (isListGameSetting(setting)) {
                const listValues = Array.isArray(currentValue)
                    ? (currentValue as number[])
                    : currentValue !== undefined && currentValue !== null
                        ? [Number(currentValue)]
                        : [];

                setting.options.forEach(option => {
                    const optionValue = typeof option.value === "number" ? option.value : Number(option.value);
                    if (Number.isNaN(optionValue))
                        return;

                    const isSelected = listValues.includes(optionValue);

                    components.push(ComponentService.createButton({
                        style: isSelected ? ButtonStyle.SUCCESS : ButtonStyle.SECONDARY,
                        label: option.label,
                    }, {
                        userId: config.userId,
                        handle: async (btnEvent: any) => {
                            const newValues = isSelected
                                ? listValues.filter(v => v !== optionValue)
                                : [...listValues, optionValue];

                            if (handlers?.onListClick) {
                                await handlers.onListClick(btnEvent, setting.key, setting, optionValue, !isSelected, newValues);
                            } else if (config.onSettingChange) {
                                config.onSettingChange(btnEvent as ButtonInteractionEvent, setting.key, newValues);
                            }
                        }
                    }));
                });
            }

            // Add separator between settings
            components.push({
                type: ComponentType.SEPARATOR,
                divider: true,
                spacing: 1
            } as Separator);
        });

        // Add Accept button
        if (config.onAccept || handlers?.onAcceptClick) {
            components.push(ComponentService.createButton({
                style: ButtonStyle.SUCCESS,
                label: new MultiLingualString(i18n.labels.common.accept),
            }, {
                userId: config.userId,
                handle: async (btnEvent) => {
                    if (handlers?.onAcceptClick) {
                        await handlers.onAcceptClick(btnEvent as ButtonInteractionEvent);
                    } else if (config.onAccept) {
                        config.onAccept();
                    }
                }
            }));
        }

        // Add Cancel button
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

        return {
            type: ComponentType.CONTAINER,
            components
        } as Container;
    }

    static createReadOnlyDisplay(config: GameSettingsDisplayConfig): Component[] {
        const components: Component[] = [];

        config.settingsSchema.forEach((setting) => {
            const currentValue = config.settings[setting.key];
            let displayEn = "";
            let displayNl = "";

            if (setting.type === GameSettingType.BOOLEAN) {
                const statusEmoji = currentValue ? "🟢" : "🔴";
                const label = setting.label.getMessage(config.languageEnum);
                displayEn = `${statusEmoji} ${label}`;
                displayNl = `${statusEmoji} ${label}`;
            } else if (setting.type === GameSettingType.ENUM) {
                const enumSetting = setting as EnumGameSetting;
                const hasValue = enumSetting.options.some(opt => opt.value === currentValue);
                const statusEmoji = hasValue ? "🟢" : "🔴";
                const label = setting.label.getMessage(config.languageEnum);
                displayEn = `${statusEmoji} ${label}`;
                displayNl = `${statusEmoji} ${label}`;
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
                const statusEmoji = hasAny ? "🟢" : "🔴";
                const label = setting.label.getMessage(config.languageEnum);
                const valuesEn = selectedOptions.map(opt => opt.label.getMessage(LanguageEnum.EN)).join(", ");
                const valuesNl = selectedOptions.map(opt => opt.label.getMessage(LanguageEnum.NL)).join(", ");

                displayEn = hasAny
                    ? `${statusEmoji} ${label}: ${valuesEn}`
                    : `${statusEmoji} ${label}`;
                displayNl = hasAny
                    ? `${statusEmoji} ${label}: ${valuesNl}`
                    : `${statusEmoji} ${label}`;
            }

            components.push({
                type: ComponentType.TEXT_DISPLAY,
                content: new MultiLingualString({
                    [LanguageEnum.EN]: displayEn,
                    [LanguageEnum.NL]: displayNl,
                })
            } as TextDisplay);
        });

        return components;
    }
} 