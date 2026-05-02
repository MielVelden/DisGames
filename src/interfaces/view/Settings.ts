import { LanguageEnum } from "../enums";

export interface SettingsResponse {
    LanguageEnum: LanguageEnum;
    ServerName: string;
    GamesEnabled: number;
}
