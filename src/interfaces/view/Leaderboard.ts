import { LanguageEnum } from "../enums";

export interface LeaderboardServerEntry {
    ServerId: string;
    Name: string;
    LanguageEnum: LanguageEnum;
    MemberCount: number;
    TotalPoints: number;
}
