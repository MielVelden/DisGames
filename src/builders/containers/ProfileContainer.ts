import { Component } from "../../interfaces/application/Message";
import { ProfileResponse } from "../../interfaces/view";
import ComponentService from "../../services/application/ComponentService";
import MediaService from "../../services/application/MediaService";
import { createBlock, createTitle } from "../../utils/helpers/Markdown";
import { createMultiLingualString, MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { i18n } from "../../utils/i18n/i18n";
import { UserRoleEnum } from "../../interfaces/enums/application/UserRoleEnum";
import ProgressBarService from "../images/BarCard";
import ProfileCard, { ProfileRole } from "../images/ProfileCard";

const ROLE_MAP: Record<number, ProfileRole> = {
    [UserRoleEnum.ADMIN]: 'admin',
    [UserRoleEnum.SYSTEM]: 'mod',
    [UserRoleEnum.USER]: 'member',
};

export async function createProfileContainerAsync(profile: ProfileResponse): Promise<Component[]> {
    const media = await ProfileCard.generate({
        username: profile.Username,
        userId: profile.UserId,
        joinedAt: profile.JoinedAt,
        role: ROLE_MAP[profile.UserRoleEnum] ?? 'member',
        rank: profile.UserRank,
        totalUsers: profile.TotalUsers,
        totalPoints: profile.TotalPoints,
        level: 3,
        xpCurrent: 760,
        xpMax: 1000,
        favoriteGame: 'Connections',
        favoriteHours: 12,
        pack: 'cosmic',
        badges: [
            { icon: '★', color: '#FFD23F', title: 'First Win', description: 'Won your first game', date: 'Jan 12, 2024' },
            { icon: '♛', color: '#D938C8', title: 'Streak Starter', description: '3-day activity streak', date: 'Feb 08, 2024' },
            { icon: '♛', color: '#D938C8', title: 'Streak Starter', description: '3-day activity streak', date: 'Feb 08, 2024' },
            { icon: '♛', color: '#D938C8', title: 'Streak Starter', description: '3-day activity streak', date: 'Feb 08, 2024' },
            { icon: '⚡', color: '#5BE2FF', title: 'Quick Draw', description: 'Answered 10 quizzes', date: 'Mar 21, 2024' },
        ],
    });

    return [
        ComponentService.createImage(media, false),
        ComponentService.createSeparator(),
    ];
}
