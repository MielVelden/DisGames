import { UserRoleEnum } from "../enums";

export interface UserResponse {
    UserId: string;
    Username: string;
    UserRoleEnum: UserRoleEnum;
    ExperiencePoints: number;
    StreakDays: number;
    GamesPlayed: number;
    CreatedAt: Date;
    UpdatedAt: Date;
}
