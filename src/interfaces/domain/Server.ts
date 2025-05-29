import { Language } from "../application/Language";

export interface ServerModel {
    id: number;
    serverId: string;
    name: string;
    language: Language;
}