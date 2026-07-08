import { Component } from "../../interfaces/application/Message";
import { LanguageEnum } from "../../interfaces/enums";
import { LeaderboardEntry, LeaderboardSubtitleTypeEnum, ServerLeaderboardRow, UserLeaderboardRow } from "../../interfaces/view";
import ComponentService from "../../services/application/ComponentService";
import { calculateUserLevel } from "../../utils/helpers/ExperiencePoints";
import LeaderboardCard from "../images/LeaderboardCard";

export function mapServerEntries(rows: ServerLeaderboardRow[]): LeaderboardEntry[] {
    return rows.map(row => ({
        Name: row.Name,
        TotalPoints: row.TotalPoints,
        SubtitleType: LeaderboardSubtitleTypeEnum.MEMBERS,
        SubtitleValue: row.MemberCount,
        Flag: row.LanguageEnum,
    }));
}

export function mapUserEntries(rows: UserLeaderboardRow[]): LeaderboardEntry[] {
    return rows.map(row => ({
        Name: row.Username,
        TotalPoints: row.ExperiencePoints,
        SubtitleType: LeaderboardSubtitleTypeEnum.LEVEL,
        SubtitleValue: calculateUserLevel(row.ExperiencePoints).currentLevel,
    }));
}

export async function createLeaderboardContainerAsync(entries: LeaderboardEntry[], language?: LanguageEnum): Promise<Component[]> {
    const media = await LeaderboardCard.generateAsync(entries, language);
    return [
        ComponentService.createImage(media, false),
    ];
}
