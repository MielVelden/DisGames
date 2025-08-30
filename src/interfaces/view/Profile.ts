import { BadgeEnum, GameTypeEnum } from "../enums";

export interface ProfileView {
    userId: string;
    username: string;
    totalPoints: number;
    mostPlayedServerId: number;
    gamePoints: {
        [key in GameTypeEnum]: number;
    };
    badges: {
        [key in BadgeEnum]: boolean;
    };
}