import { Component, ComponentType, Container, TextDisplay, Title, Separator } from "../interfaces/application/Message";
import { ButtonStyle } from "../interfaces/application/Message";
import { 
    GameSettingsSchema, 
    GameSettingsValues, 
    GameSettingType,
    BooleanGameSetting,
    EnumGameSetting,
    GameSettingsValidationResult
} from "../interfaces/domain/GameSettings";
import { LanguageEnum } from "../interfaces/enums";
import ComponentService from "../services/ComponentService";
import { MultiLingualString } from "./i18n/MultiLangualString";
import { i18n } from "./i18n/i18n";

export class GameSettingsUtils {
    
    static validateSettings(schema: GameSettingsSchema, values: GameSettingsValues): GameSettingsValidationResult {
        const errors: string[] = [];
        const validatedValues: GameSettingsValues = {};

        Object.entries(schema).forEach(([key, setting]) => {
            const value = values[key];
            
            if (setting.required && (value === undefined || value === null)) {
                errors.push(`Setting '${key}' is required`);
                return;
            }

            if (value !== undefined && value !== null) {
                if (setting.type === GameSettingType.BOOLEAN) {
                    if (typeof value !== 'boolean') {
                        errors.push(`Setting '${key}' must be a boolean`);
                        return;
                    }
                    validatedValues[key] = value;
                } else if (setting.type === GameSettingType.ENUM) {
                    const enumSetting = setting as EnumGameSetting;
                    const validValues = enumSetting.options.map(opt => opt.value);
                    if (!validValues.includes(value as string | number)) {
                        errors.push(`Setting '${key}' must be one of: ${validValues.join(', ')}`);
                        return;
                    }
                    validatedValues[key] = value;
                }
            } else {
                // Use default value
                validatedValues[key] = setting.type === GameSettingType.BOOLEAN 
                    ? (setting as BooleanGameSetting).defaultValue
                    : (setting as EnumGameSetting).defaultValue;
            }
        });

        return {
            isValid: errors.length === 0,
            errors,
            values: validatedValues
        };
    }

    static getDefaultValues(schema: GameSettingsSchema): GameSettingsValues {
        const defaultValues: GameSettingsValues = {};
        
        Object.entries(schema).forEach(([key, setting]) => {
            if (setting.type === GameSettingType.BOOLEAN) {
                defaultValues[key] = (setting as BooleanGameSetting).defaultValue;
            } else if (setting.type === GameSettingType.ENUM) {
                defaultValues[key] = (setting as EnumGameSetting).defaultValue;
            }
        });

        return defaultValues;
    }

    static createSettingsDisplayComponents(
        schema: GameSettingsSchema, 
        values: GameSettingsValues, 
        languageEnum: LanguageEnum,
        isReadOnly: boolean = false
    ): Component[] {
        const components: Component[] = [];

        Object.entries(schema).forEach(([key, setting]) => {
            const currentValue = values[key];

            // Title for setting
            components.push({
                type: ComponentType.TITLE,
                content: setting.label
            } as Title);

            // Description if available
            if (setting.description) {
                components.push({
                    type: ComponentType.TEXT_DISPLAY,
                    content: setting.description
                } as TextDisplay);
            }

            if (setting.type === GameSettingType.BOOLEAN) {
                const booleanValue = currentValue as boolean;
                
                if (isReadOnly) {
                    components.push({
                        type: ComponentType.TEXT_DISPLAY,
                        content: new MultiLingualString(booleanValue ? i18n.commands.games.settings.enabled : i18n.commands.games.settings.disabled)
                    } as TextDisplay);
                } else {
                    // Create toggle buttons for boolean
                    components.push(ComponentService.createButton({
                        style: booleanValue ? ButtonStyle.SUCCESS : ButtonStyle.SECONDARY,
                        label: new MultiLingualString(i18n.commands.games.settings.enabled),
                    }));
                    
                    components.push(ComponentService.createButton({
                        style: !booleanValue ? ButtonStyle.DANGER : ButtonStyle.SECONDARY,
                        label: new MultiLingualString(i18n.commands.games.settings.disabled),
                    }));
                }
            } else if (setting.type === GameSettingType.ENUM) {
                const enumSetting = setting as EnumGameSetting;
                const currentEnumValue = currentValue;

                if (isReadOnly) {
                    const selectedOption = enumSetting.options.find(opt => opt.value === currentEnumValue);
                    components.push({
                        type: ComponentType.TEXT_DISPLAY,
                        content: selectedOption?.label || new MultiLingualString(i18n.commands.games.settings.unknown)
                    } as TextDisplay);
                } else {
                    // Create buttons for each enum option
                    enumSetting.options.forEach(option => {
                        const isSelected = option.value === currentEnumValue;
                        components.push(ComponentService.createButton({
                            style: isSelected ? ButtonStyle.SUCCESS : ButtonStyle.SECONDARY,
                            label: option.label,
                        }));
                    });
                }
            }

            // Add separator between settings
            components.push({
                type: ComponentType.SEPARATOR,
                divider: true,
                spacing: 1
            } as Separator);
        });

        // Remove last separator
        if (components.length > 0 && components[components.length - 1].type === ComponentType.SEPARATOR) {
            components.pop();
        }

        return components;
    }

    static createInteractiveSettingsContainer(
        schema: GameSettingsSchema,
        values: GameSettingsValues,
        languageEnum: LanguageEnum,
        onSettingChange: (key: string, value: boolean | string | number) => void
    ): Container {
        const components = this.createSettingsDisplayComponents(schema, values, languageEnum, false);
        
        // Add interactive handlers to buttons
        // Note: This would need to be implemented with proper event handlers
        // For now, we return the base components
        
        return {
            type: ComponentType.CONTAINER,
            components: [
                {
                    type: ComponentType.TITLE,
                    content: new MultiLingualString(i18n.commands.games.settings.title)
                },
                ...components
            ]
        } as Container;
    }

    static createReadOnlySettingsContainer(
        schema: GameSettingsSchema,
        values: GameSettingsValues,
        languageEnum: LanguageEnum
    ): Container {
        const components = this.createSettingsDisplayComponents(schema, values, languageEnum, true);
        
        return {
            type: ComponentType.CONTAINER,
            components: [
                {
                    type: ComponentType.TITLE,
                    content: new MultiLingualString(i18n.commands.games.settings.currentSettings)
                },
                ...components
            ]
        } as Container;
    }
} 