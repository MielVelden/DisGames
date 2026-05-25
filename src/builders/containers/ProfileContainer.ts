import { Component } from "../../interfaces/application/Message";
import { ProfileResponse } from "../../interfaces/view";
import ComponentService from "../../services/application/ComponentService";
import ProfileCard from "../images/ProfileCard";
import { AchievementEnum } from "../../interfaces/enums/database/AchievementEnum";

export async function createProfileContainerAsync(profile: ProfileResponse): Promise<Component[]> {
    const media = await ProfileCard.generate({
        username: profile.Username,
        userId: profile.UserId,
        joinedAt: profile.JoinedAt,
        role: profile.UserRoleEnum,
        rank: profile.UserRank,
        totalUsers: profile.TotalUsers,
        totalPoints: profile.TotalPoints,
        level: 3,
        xpCurrent: 760,
        xpMax: 1000,
        favoriteGame: 'Connections',
        favoriteHours: 12,
        badges: [
            { achievementEnum: AchievementEnum.SEVEN_DAYS_STREAK, title: 'Quick Draw', description: 'Answered 10 quizzes', date: 'Mar 21, 2024' },
            { achievementEnum: AchievementEnum.FIRST_GAME, title: 'Streak Starter', description: '3-day activity streak', date: 'Feb 18, 2024' },
            { achievementEnum: AchievementEnum.FIRST_GAME, title: 'Streak Starter', description: '3-day activity streak', date: 'Feb 08, 2024' },
            { achievementEnum: AchievementEnum.SEVEN_DAYS_STREAK, title: 'Quick Draw', description: 'Answered 10 quizzes', date: 'Mar 21, 2024' },
            { achievementEnum: AchievementEnum.SEVEN_DAYS_STREAK, title: 'Quick Draw', description: 'Answered 10 quizzes', date: 'Mar 21, 2024' },
        ],
    });

    return [
        ComponentService.createImage(media, false),
        ComponentService.createSeparator(),
    ];
}
