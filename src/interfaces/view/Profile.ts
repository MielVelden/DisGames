import { GameTypeEnum, UserRoleEnum } from "../enums";
import { AchievementEnum } from "../enums/database/AchievementEnum";

export interface ProfileAchievement {
    achievementEnum: AchievementEnum;
    date: Date;
}

export interface ProfileLevel {
    level: number;
    xpCurrent: number;
    xpMax: number;
}

export interface ProfileFavoriteGame {
    gameId: GameTypeEnum;
    points: number;
}

export interface ProfileCardData {
    UserId: string;
    Username: string;
    CreatedAt: Date;
    UserRoleEnum: UserRoleEnum;
    UserRank: number;
    TotalUsers: number;
    TotalPoints: number;
    level: ProfileLevel;
    favoriteGame: ProfileFavoriteGame;
    leastFavoriteGame?: ProfileFavoriteGame;
    achievements?: ProfileAchievement[];
}

export interface ProfileResponse {
    UserId: string;
    Username: string;
    UserRoleEnum: number;
    TotalPoints: number;
    UserRank: number;
    TotalUsers: number;
    CreatedAt: Date;
}

export interface ProfileGameResponse {
    gameType: GameTypeEnum;
    username?: string;
    gamePoints: number;
    gameRank: number;
    gameRankPlayerCount: number;
}