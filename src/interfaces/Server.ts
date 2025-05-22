import { Language } from "./Language";

export interface Server {
    id: string;
    name: string;
    language: Language;
//    games: GameData[];
}