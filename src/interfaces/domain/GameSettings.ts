import { MultiLingualString } from "../../utils/i18n/MultiLangualString";

export enum GameSettingType {
    BOOLEAN = "boolean",
    ENUM = "enum"
}

export interface GameSettingOption {
    value: string | number;
    label: MultiLingualString;
    description?: MultiLingualString;
    isDefault?: boolean;
}

export interface BaseGameSetting {
    key: string;
    label: MultiLingualString;
    description?: MultiLingualString;
    required?: boolean;
    type: GameSettingType;
}

export interface BooleanGameSetting extends BaseGameSetting {
    type: GameSettingType.BOOLEAN;
    defaultValue: boolean;
}

export interface EnumGameSetting extends BaseGameSetting {
    type: GameSettingType.ENUM;
    options: GameSettingOption[];
    defaultValue: string | number;
}

export type GameSetting = BooleanGameSetting | EnumGameSetting;

export interface GameSettingsSchema {
    [key: string]: GameSetting;
}

export interface GameSettingsValues {
    [key: string]: boolean | string | number;
}

export interface GameSettingsValidationResult {
    isValid: boolean;
    errors: string[];
    values: GameSettingsValues;
} 