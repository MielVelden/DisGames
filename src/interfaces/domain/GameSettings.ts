import { MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { GameSettingsEnum } from "../enums/games/GameSettingsEnum";
import { DifficultyEnum } from "../enums/games/DifficultyEnum";

export enum GameSettingType {
    BOOLEAN = "boolean",
    ENUM = "enum",
    LIST = "list"
}

export interface GameSettingOption {
    value: string | number;
    label: MultiLingualString;
    description?: MultiLingualString;
    isDefault?: boolean;
}

export interface BaseGameSetting {
    key: GameSettingsEnum;
    label: MultiLingualString;
    description?: MultiLingualString;
    required?: boolean;
    type: GameSettingType;
}

export interface BooleanGameSetting extends BaseGameSetting {
    type: GameSettingType.BOOLEAN;
    defaultValue: boolean;
}

export function isBooleanGameSetting(setting: GameSetting): setting is BooleanGameSetting {
    return setting.type === GameSettingType.BOOLEAN;
}

export interface EnumGameSetting extends BaseGameSetting {
    type: GameSettingType.ENUM;
    options: GameSettingOption[];
    defaultValue: string | number;
}

export function isEnumGameSetting(setting: GameSetting): setting is EnumGameSetting {
    return setting.type === GameSettingType.ENUM;
}

export interface ListGameSetting extends BaseGameSetting {
    type: GameSettingType.LIST;
    options: GameSettingOption[];
}

export function isListGameSetting(setting: GameSetting): setting is ListGameSetting {
    return setting.type === GameSettingType.LIST;
}

export type GameSetting = BooleanGameSetting | EnumGameSetting | ListGameSetting;

export type GameSettingsSchema = GameSetting[];

export type GameSettingsValues = Partial<Record<GameSettingsEnum, boolean | string | number | number[]>>;

export interface GameSettingsValidationResult {
    isValid: boolean;
    errors: MultiLingualString[];
    values: GameSettingsValues;
} 

// Specific settings for each game type
export interface Games_Settings {
  difficulty?: DifficultyEnum;
  resetOnFail?: boolean;
  datasheets?: number[];
} 