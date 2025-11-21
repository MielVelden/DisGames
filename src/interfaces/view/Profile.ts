import { MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { GameTypeEnum } from "../enums";

export interface ProfileView {
    UserId: string;
    Username: string;
    UserRoleEnum: number;
    TotalPoints: number;
    UserRank: number;
    TotalUsers: number;
}

export interface ProfileGameView {
    gameType: GameTypeEnum;
    gamePoints: number;
    gameRank: number;
    gameRankPlayerCount: number;
}