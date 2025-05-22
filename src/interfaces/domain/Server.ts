import { Language } from "../application/Language";
import { IEntity } from "../database/IEntity";

export interface Server extends IEntity {
    serverId: string;
    name: string;
    language: Language;
} 