import { MultiLingualString } from "../../utils/i18n/MultiLingualString";

export interface ProfileView {
    UserId: string;
    Username: string;
    UserRoleEnum: number;
    TotalPoints: number;
    UserRank: number;
    TotalUsers: number;
}

export interface ProfileGameView {
    gameName: MultiLingualString;
    gamePoints: number;
    gameRank: number;
    gameRankPlayerCount: number;
}