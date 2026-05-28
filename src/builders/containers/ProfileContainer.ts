import { Component } from "../../interfaces/application/Message";
import { ProfileResponse } from "../../interfaces/view";
import ComponentService from "../../services/application/ComponentService";
import ProfileCard from "../images/ProfileCard";
import { AchievementEnum } from "../../interfaces/enums/database/AchievementEnum";
import { GameTypeEnum } from "../../interfaces/enums";
import { createTitle } from "../../utils/helpers/Markdown";

export async function createProfileContainerAsync(profile: ProfileResponse): Promise<Component[]> {
    const media = await ProfileCard.generateAsync({
        Username: profile.Username,
        UserId: profile.UserId,
        CreatedAt: profile.CreatedAt,
        UserRoleEnum: profile.UserRoleEnum,
        UserRank: profile.UserRank,
        TotalUsers: profile.TotalUsers,
        TotalPoints: profile.TotalPoints,
        level: {
            level: Math.floor(profile.TotalPoints / 1000),
            xpCurrent: profile.TotalPoints % 1000,
            xpMax: 1000,
        },
        favoriteGame: {
            gameId: GameTypeEnum.CONNECTIONS, // Placeholder, replace with actual favorite game ID
            points: 500, // Placeholder, replace with actual points in favorite game
        },
        leastFavoriteGame: {
            gameId: GameTypeEnum.ANAGRAM, // Placeholder, replace with actual least favorite game ID
            points: 100, // Placeholder, replace with actual points in least favorite game
        },
        achievements: [
            { achievementEnum: AchievementEnum.SEVEN_DAYS_STREAK, date: new Date('Mar 21, 2024') },
            { achievementEnum: AchievementEnum.FIRST_GAME, date: new Date('Feb 18, 2024') },
            { achievementEnum: AchievementEnum.FIRST_GAME, date: new Date('Feb 08, 2024') },
            { achievementEnum: AchievementEnum.SEVEN_DAYS_STREAK, date: new Date('Mar 21, 2024') },
            { achievementEnum: AchievementEnum.SEVEN_DAYS_STREAK, date: new Date('Mar 21, 2024') },
        ],
    });

    return [
        ComponentService.createImage(media, false),
        ComponentService.createSeparator(),
    ];
}
