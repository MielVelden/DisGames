import { GameSettingsSchema, GameSettingsValues, EnumGameSetting } from "../domain/GameSettings";
import { GameSettingsEnum } from "../enums/games/GameSettingsEnum";
import { LanguageEnum } from "../enums";
import { Component } from "./Message";
import { ButtonInteractionEvent } from "./Event";

export interface GameSettingsContainerConfig {
    settingsSchema: GameSettingsSchema;
    currentSettings: GameSettingsValues;
    languageEnum: LanguageEnum;
    userId: string;
    onSettingChange?: (btnEvent: ButtonInteractionEvent, key: GameSettingsEnum, value: boolean | string | number) => void;
    onAccept?: () => void;
    onCancel?: () => void;
}

export interface GameSettingsHandler {
    onBooleanClick?: (btnEvent: ButtonInteractionEvent, key: GameSettingsEnum, currentValue: boolean) => Promise<void>;
    onEnumClick?: (btnEvent: ButtonInteractionEvent, key: GameSettingsEnum, enumSetting: EnumGameSetting, currentValue: any) => Promise<void>;
    onAcceptClick?: (btnEvent: ButtonInteractionEvent) => Promise<void>;
    onCancelClick?: (btnEvent: ButtonInteractionEvent) => Promise<void>;
}

export interface GameSettingsDisplayConfig {
    settingsSchema: GameSettingsSchema;
    settings: GameSettingsValues;
    languageEnum: LanguageEnum;
} 