import { MultiLingualString } from "../../utils/i18n/MultiLangualString";
import { GameSettingsEnum } from "../enums/games/GameSettingsEnum";

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

export interface EnumGameSetting extends BaseGameSetting {
    type: GameSettingType.ENUM;
    options: GameSettingOption[];
    defaultValue: string | number;
}

export type GameSetting = BooleanGameSetting | EnumGameSetting;

export type GameSettingsSchema = GameSetting[];

export type GameSettingsValues = Partial<Record<GameSettingsEnum, boolean | string | number>>;

export interface GameSettingsValidationResult {
    isValid: boolean;
    errors: MultiLingualString[];
    values: GameSettingsValues;
} 