import { LanguageEnumTranslations } from "../../../interfaces/application/i18n";
import { LanguageEnum } from "../../../interfaces/enums/database/LanguageEnum";
import { ChartTypeEnum } from "../../../interfaces/enums/application/ChartTypeEnum";

// Only English translated so far — NL mirrors EN as a placeholder until the rest are done.
export const chartTranslations: LanguageEnumTranslations<ChartTypeEnum> = {
    [ChartTypeEnum.LineChart_User_NewUser]: {
        [LanguageEnum.EN]: "New Users",
        [LanguageEnum.NL]: "New Users",
    },
    [ChartTypeEnum.LineChart_Server_NewServer]: {
        [LanguageEnum.EN]: "Server Growth",
        [LanguageEnum.NL]: "Server Growth",
    },
    [ChartTypeEnum.BarChart_Events_EventsByType]: {
        [LanguageEnum.EN]: "Events by Type",
        [LanguageEnum.NL]: "Events by Type",
    },
    [ChartTypeEnum.BarChart_Events_ActivityOverTime]: {
        [LanguageEnum.EN]: "Activity over time",
        [LanguageEnum.NL]: "Activity over time",
    },
    [ChartTypeEnum.BarChart_Events_EventsPerHour]: {
        [LanguageEnum.EN]: "Events per hour",
        [LanguageEnum.NL]: "Events per hour",
    },
    [ChartTypeEnum.PieChart_Server_LanguageDistribution]: {
        [LanguageEnum.EN]: "Server Language Distribution",
        [LanguageEnum.NL]: "Server Language Distribution",
    },
    [ChartTypeEnum.PieChart_Games_GamesByType]: {
        [LanguageEnum.EN]: "Games by Type",
        [LanguageEnum.NL]: "Games by Type",
    },
};
