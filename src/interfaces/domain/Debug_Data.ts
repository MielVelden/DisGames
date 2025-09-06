import { GameTypeEnum } from "../enums";
import { Games_Settings } from "./GameSettings";

export interface Debug_Data {
    games: {
        id: number;
        name: GameTypeEnum;
        channelId: string;
        serverId: string;
        answer: string | number | boolean;
        settings: Games_Settings;
    }[];
}
