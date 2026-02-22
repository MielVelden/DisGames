import { GameTypeEnum } from "../enums";

export interface ProfileResponse {
    UserId: string;
    Username: string;
    UserRoleEnum: number;
    TotalPoints: number;
    UserRank: number;
    TotalUsers: number;
    JoinedAt: Date;
}

export interface ProfileGameResponse {
    gameType: GameTypeEnum;
    username?: string;
    gamePoints: number;
    gameRank: number;
    gameRankPlayerCount: number;
}