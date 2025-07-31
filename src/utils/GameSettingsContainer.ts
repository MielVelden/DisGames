import { Component, ComponentType, Container, ActionButton, ButtonStyle, Title, TextDisplay, Separator } from "../interfaces/application/Message";
import { GameSettingsSchema, GameSettingsValues, GameSettingType, BooleanGameSetting, EnumGameSetting } from "../interfaces/domain/GameSettings";
import { LanguageEnum } from "../interfaces/enums";
import ComponentService from "../services/ComponentService";
import { i18n } from "./i18n/i18n";
import { MultiLingualString } from "./i18n/MultiLangualString";

export class GameSettingsContainer {
    
    static createInteractiveSettingsContainer(
        settingsSchema: GameSettingsSchema,
        currentSettings: GameSettingsValues,
        languageEnum: LanguageEnum,
        onBooleanToggle: (key: string, currentValue: boolean) => void,
        onEnumSelect: (key: string, enumSetting: EnumGameSetting, currentValue: any) => void,
        onAccept: () => void,
        onCancel: () => void,
        userId: string,
        handlers?: {
            onBooleanClick: (btnEvent: any, key: string, currentValue: boolean) => Promise<void>;
            onEnumClick: (btnEvent: any, key: string, enumSetting: EnumGameSetting, currentValue: any) => Promise<void>;
            onAcceptClick: (btnEvent: any) => Promise<void>;
            onCancelClick: (btnEvent: any) => Promise<void>;
        }
    ): Container {
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
        
        // Create buttons for each setting
        Object.entries(settingsSchema).forEach(([key, setting]) => {
            const currentValue = currentSettings[key];
            
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
            
            if (setting.type === GameSettingType.BOOLEAN) {
                const boolValue = currentValue as boolean;
                // Boolean toggle button
                components.push(ComponentService.createButton({
                    style: boolValue ? ButtonStyle.SUCCESS : ButtonStyle.SECONDARY,
                    label: new MultiLingualString(boolValue ? i18n.commands.games.settings.enabled : i18n.commands.games.settings.disabled),
                }, {
                    userId: userId,
                    handle: async (btnEvent) => {
                        if (handlers?.onBooleanClick) {
                            await handlers.onBooleanClick(btnEvent, key, boolValue);
                        } else {
                            onBooleanToggle(key, boolValue);
                        }
                    }
                }));
            } else if (setting.type === GameSettingType.ENUM) {
                const enumSetting = setting as EnumGameSetting;
                const selectedOption = enumSetting.options.find(opt => opt.value === currentValue);
                
                // Enum selection button
                components.push(ComponentService.createButton({
                    style: ButtonStyle.PRIMARY,
                    label: selectedOption?.label || new MultiLingualString(i18n.commands.games.settings.unknown),
                }, {
                    userId: userId,
                    handle: async (btnEvent) => {
                        if (handlers?.onEnumClick) {
                            await handlers.onEnumClick(btnEvent, key, enumSetting, currentValue);
                        } else {
                            onEnumSelect(key, enumSetting, currentValue);
                        }
                    }
                }));
            }
            
            // Add separator between settings
            components.push({
                type: ComponentType.SEPARATOR,
                divider: true,
                spacing: 1
            } as Separator);
        });
        
        // Add Accept button
        components.push(ComponentService.createButton({
            style: ButtonStyle.SUCCESS,
            label: new MultiLingualString(i18n.common.accept),
        }, {
            userId: userId,
            handle: async (btnEvent) => {
                if (handlers?.onAcceptClick) {
                    await handlers.onAcceptClick(btnEvent);
                } else {
                    onAccept();
                }
            }
        }));
        
        // Add Cancel button
        components.push(ComponentService.createButton({
            style: ButtonStyle.SECONDARY,
            label: new MultiLingualString(i18n.common.cancel),
        }, {
            userId: userId,
            handle: async (btnEvent) => {
                if (handlers?.onCancelClick) {
                    await handlers.onCancelClick(btnEvent);
                } else {
                    onCancel();
                }
            }
        }));
        
        return {
            type: ComponentType.CONTAINER,
            components
        } as Container;
    }
    
    static createCompactSettingsDisplay(
        settingsSchema: GameSettingsSchema,
        settings: GameSettingsValues,
        languageEnum: LanguageEnum
    ): Component[] {
        const components: Component[] = [];
        
        Object.entries(settingsSchema).forEach(([key, setting]) => {
            const currentValue = settings[key];
            let statusEmoji = "";
            
            if (setting.type === GameSettingType.BOOLEAN) {
                statusEmoji = currentValue ? "🟢" : "🔴";
            } else if (setting.type === GameSettingType.ENUM) {
                const enumSetting = setting as EnumGameSetting;
                const hasValue = enumSetting.options.some(opt => opt.value === currentValue);
                statusEmoji = hasValue ? "🟢" : "🔴";
            }
            
            components.push({
                type: ComponentType.TEXT_DISPLAY,
                content: new MultiLingualString({
                    [LanguageEnum.EN]: `${statusEmoji} ${setting.label.getMessage(languageEnum)}`,
                    [LanguageEnum.NL]: `${statusEmoji} ${setting.label.getMessage(languageEnum)}`,
                })
            } as TextDisplay);
        });
        
        return components;
    }
} 