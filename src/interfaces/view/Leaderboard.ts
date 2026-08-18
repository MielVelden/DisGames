import { LanguageEnum } from "../enums";

export enum LeaderboardSubtitleTypeEnum {
    MEMBERS = "members",
    LEVEL = "level",
}

export interface LeaderboardEntry {
    Name: string;
    TotalPoints: number;
    SubtitleType: LeaderboardSubtitleTypeEnum;
    SubtitleValue: number;
    Flag?: LanguageEnum;
}

export interface ServerLeaderboardRow {
    ServerId: string;
    Name: string;
    LanguageEnum: LanguageEnum;
    MemberCount: number;
    TotalPoints: number;
}

export interface UserLeaderboardRow {
    UserId: string;
    Username: string;
    ExperiencePoints: number;
}
