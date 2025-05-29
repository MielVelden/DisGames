import { LanguageEnum } from "../enums/database/LanguageEnum";

export interface ServerModel {
    id: number;
    serverId: string;
    name: string;
    language: LanguageEnum;
}