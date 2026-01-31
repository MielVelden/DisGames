import { GameTypeEnum } from "../enums";

export interface ProfileView {
    UserId: string;
    Username: string;
    UserRoleEnum: number;
    TotalPoints: number;
    UserRank: number;
    TotalUsers: number;
    JoinedAt: Date;
}

export interface ProfileGameView {
    gameType: GameTypeEnum;
    username?: string;
    gamePoints: number;
    gameRank: number;
    gameRankPlayerCount: number;
}