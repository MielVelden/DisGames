import { AchievementEnum } from '../enums/database/AchievementEnum';

export interface UserAchievementEntry {
    achievementEnum: AchievementEnum;
    level: number;
    unlockedAt: Date;
}

export interface Users_UserAchievementData {
    unlocked: UserAchievementEntry[];
    gamesCompleted: number;
    currentStreakDays: number;
    lastPlayedAt: Date | null;
}
