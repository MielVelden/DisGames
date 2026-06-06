import { Component } from "../../interfaces/application/Message";
import { ProfileResponse } from "../../interfaces/view";
import ComponentService from "../../services/application/ComponentService";
import ProfileCard from "../images/ProfileCard";
import { BadgeEnum } from "../../interfaces/enums/application/BadgeEnum";
import { GameTypeEnum } from "../../interfaces/enums";
import { calculateUserLevel } from "../../utils/helpers/ExperiencePoints";

export async function createProfileContainerAsync(profile: ProfileResponse): Promise<Component[]> {
    const media = await ProfileCard.generateAsync({
        Username: profile.Username,
        UserId: profile.UserId,
        CreatedAt: profile.CreatedAt,
        UserRoleEnum: profile.UserRoleEnum,
        UserRank: profile.UserRank,
        TotalUsers: profile.TotalUsers,
        TotalPoints: profile.TotalPoints,
        level: calculateUserLevel(profile.ExperiencePoints),
        favoriteGame: {
            gameId: GameTypeEnum.CONNECTIONS, // Placeholder, replace with actual favorite game ID
            points: 500, // Placeholder, replace with actual points in favorite game
        },
        leastFavoriteGame: {
            gameId: GameTypeEnum.ANAGRAM, // Placeholder, replace with actual least favorite game ID
            points: 100, // Placeholder, replace with actual points in least favorite game
        },
        badges: [
            { achievementEnum: BadgeEnum.DAY_STREAK, date: new Date('Mar 21, 2024'), level: 3 }, // TODO: mock level, replace with real badge level
            { achievementEnum: BadgeEnum.FIRST_GAME, date: new Date('Feb 18, 2024'), level: 1 },
            { achievementEnum: BadgeEnum.FIRST_GAME, date: new Date('Feb 08, 2024'), level: 1 },
            { achievementEnum: BadgeEnum.DAY_STREAK, date: new Date('Mar 21, 2024'), level: 7 },
            { achievementEnum: BadgeEnum.DAY_STREAK, date: new Date('Mar 21, 2024'), level: 12 },
        ],
    });

    return [
        ComponentService.createImage(media, false),
        ComponentService.createSeparator(),
    ];
}
