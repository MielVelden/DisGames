import { GameSettingsSchema, GameSettingsValues } from "../domain/GameSettings";
import { LanguageEnum } from "../enums";

export interface GameSettingsDisplayConfig {
    settingsSchema: GameSettingsSchema;
    settings: GameSettingsValues;
    languageEnum: LanguageEnum;
}
