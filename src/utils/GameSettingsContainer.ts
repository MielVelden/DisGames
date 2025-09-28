import { Component, ComponentType, Container, TextDisplay, Title, Separator } from "../interfaces/application/Message";
import { ButtonStyle } from "../interfaces/application/Message";
import { 
    GameSettingsSchema, 
    GameSettingsValues, 
    GameSettingType,
    BooleanGameSetting,
    EnumGameSetting
} from "../interfaces/domain/GameSettings";
import { GameSettingsEnum } from "../interfaces/enums/games/GameSettingsEnum";
import { LanguageEnum } from "../interfaces/enums";
import { 
    GameSettingsContainerConfig, 
    GameSettingsHandler, 
    GameSettingsDisplayConfig 
} from "../interfaces/application/GameSetting";
import ComponentService from "../services/ComponentService";
import { MultiLingualString } from "../interfaces/application/MultiLangualString";
import { i18n } from "./i18n/i18n";
import { ButtonInteractionEvent } from "../interfaces/application/Event";

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
            
            if (setting.type === GameSettingType.BOOLEAN) {
                const boolValue = currentValue as boolean;
                components.push(ComponentService.createButton({
                    style: boolValue ? ButtonStyle.SUCCESS : ButtonStyle.SECONDARY,
                    label: new MultiLingualString(boolValue ? i18n.commands.games.settings.enabled : i18n.commands.games.settings.disabled),
                }, {
                    userId: config.userId,
                    handle: async (btnEvent: any) => {
                        if (handlers?.onBooleanClick) {
                            await handlers.onBooleanClick(btnEvent, setting.key, boolValue);
                        } else if (config.onSettingChange) {
                            config.onSettingChange(btnEvent as ButtonInteractionEvent, setting.key, !boolValue);
                        }
                    }
                }));
            } else if (setting.type === GameSettingType.ENUM) {
                const enumSetting = setting as EnumGameSetting;
                const selectedOption = enumSetting.options.find(opt => opt.value === currentValue);
                
                components.push(ComponentService.createButton({
                    style: ButtonStyle.PRIMARY,
                    label: selectedOption?.label || new MultiLingualString(i18n.commands.games.settings.unknown),
                }, {
                    userId: config.userId,
                    handle: async (btnEvent: any) => {
                        if (handlers?.onEnumClick) {
                            await handlers.onEnumClick(btnEvent, setting.key, enumSetting, currentValue);
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
        if (config.onAccept || handlers?.onAcceptClick) {
            components.push(ComponentService.createButton({
                style: ButtonStyle.SUCCESS,
                label: new MultiLingualString(i18n.common.accept),
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
                label: new MultiLingualString(i18n.common.cancel),
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
                    [LanguageEnum.EN]: `${statusEmoji} ${setting.label.getMessage(config.languageEnum)}`,
                    [LanguageEnum.NL]: `${statusEmoji} ${setting.label.getMessage(config.languageEnum)}`,
                })
            } as TextDisplay);
        });
        
        return components;
    }
} 