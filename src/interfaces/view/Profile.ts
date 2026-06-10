import { UserLevelData } from "../domain";
import { GameTypeEnum, UserRoleEnum } from "../enums";
import { BadgeEnum } from "../enums/application/BadgeEnum";

export interface ProfileBadge {
    achievementEnum: BadgeEnum;
    date: Date;
    level: number;
    threshold: number;
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
    Level: UserLevelData;
    favoriteGame?: ProfileFavoriteGame;
    leastFavoriteGame?: ProfileFavoriteGame;
    badges?: ProfileBadge[];
}

export interface ProfileResponse {
    UserId: string;
    Username: string;
    UserRoleEnum: number;
    ExperiencePoints: number;
    TotalPoints: number;
    UserRank: number;
    TotalUsers: number;
    CreatedAt: Date;
    FavoriteGameId: number | null;
    FavoriteGamePoints: number | null;
    LeastFavoriteGameId: number | null;
    LeastFavoriteGamePoints: number | null;
}

export interface ProfileGameResponse {
    gameType: GameTypeEnum;
    username?: string;
    gamePoints: number;
    gameRank: number;
    gameRankPlayerCount: number;
}