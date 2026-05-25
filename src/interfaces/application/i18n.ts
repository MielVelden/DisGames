import { ExceptionEnum, MetricEnum, UserRoleEnum } from "../enums";
import { GamesCommandActionEnum } from "../enums/commands/Games";
import { ProfileCommandActionEnum } from "../enums/commands/Profile";
import { GameTypeEnum } from "../enums/database/GameTypeEnum";
import { LanguageEnum } from "../enums/database/LanguageEnum";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";

export type LanguageTranslations = {
    [LanguageEnum.EN]: string;
    [LanguageEnum.NL]: string;
    [LanguageEnum.ES]?: string;
    [LanguageEnum.DE]?: string;
    [LanguageEnum.PT]?: string;
};

export type ParameterizedTranslation = (...params: string[]) => MultiLingualString;

export type LanguageCommandOptionTranslations<T extends string | number> = {
    action: LanguageTranslations,
    actionDescription: LanguageTranslations,
    noAction: LanguageTranslations,
    choices: LanguageEnumTranslations<T>;
};

export type LanguageEnumTranslations<T extends string | number> = {
    [K in T]: {
        [LanguageEnum.EN]: string;
        [LanguageEnum.NL]: string;
        [LanguageEnum.ES]?: string;
        [LanguageEnum.DE]?: string;
        [LanguageEnum.PT]?: string;
    }
};

export type LanguageGameTypeTranslations<T extends GameTypeEnum> = {
    [K in T]: {
        name: LanguageTranslations;
        description: LanguageTranslations;
        longDescription: LanguageTranslations;
        howToPlay: LanguageTranslations;
        startMessage: (firstAnswer?: string) => MultiLingualString;
        nextAnswer?: (nextAnswer?: string | number) => MultiLingualString;
        incorrectAnswer?: () => MultiLingualString;
        gameComplete?: () => MultiLingualString;
    }
}

export function isMultiLingualString(value: any): value is MultiLingualString {
    return value instanceof MultiLingualString;
}

export interface I18nTranslations {
    labels: {
        common: {
            success: LanguageTranslations;
            enabled: LanguageTranslations;
            disabled: LanguageTranslations;
            cancel: LanguageTranslations;
            accept: LanguageTranslations;
            deny: LanguageTranslations;
            cancelled: LanguageTranslations;
            delete: LanguageTranslations;
            askQuestion: LanguageTranslations;
            notEnoughPermissions: LanguageTranslations;
            notYourEvent: LanguageTranslations;
            welcome: {
                title: LanguageTranslations;
                description: LanguageTranslations;
            },
            timedOut: {
                title: LanguageTranslations;
                description: LanguageTranslations;
            };
        },
        handleNever: (uniqueCase: string, origin: string) => MultiLingualString;
    },
    tables: {
        users: {
            singleName: LanguageTranslations;
            multiName: LanguageTranslations;
            fields: {
                username: LanguageTranslations;
            };
        },
        points: {
            singleName: LanguageTranslations;
            multiName: LanguageTranslations;
        },
    }
    commands: {
        debug: {
            description: LanguageTranslations;
            labels: {
                title: LanguageTranslations;
                thanks: LanguageTranslations;
                description: (uniqueCode: string) => MultiLingualString;
            }
        },
        games: {
            description: LanguageTranslations;
            option: LanguageCommandOptionTranslations<GamesCommandActionEnum>;
            labels: {
                noActiveGames: LanguageTranslations;
                success: LanguageTranslations;
                selectGame: {
                    title: LanguageTranslations;
                    description: LanguageTranslations;
                };
                deleteSuccess: {
                    title: LanguageTranslations;
                    description: LanguageTranslations;
                };
                chooseChannel: LanguageTranslations;
                movedToChannel: {
                    title: LanguageTranslations;
                    description: (channel: string) => MultiLingualString;
                };
                skipAnswer: LanguageTranslations;
                howToPlay: LanguageTranslations;
                incorrectAnswer: LanguageTranslations;
                gameName: (gameName: string) => MultiLingualString;
                channelName: (channelName: string) => MultiLingualString;
            },
            settings: {
                title: LanguageTranslations;
                description: LanguageTranslations;
                currentSettings: LanguageTranslations;
                enabled: LanguageTranslations;
                disabled: LanguageTranslations;
                unknown: LanguageTranslations;
                gameDescription: LanguageTranslations;
                currentChannel: LanguageTranslations;
                resetOnFail: {
                    title: LanguageTranslations;
                    description: LanguageTranslations;
                };
                difficulty: {
                    label: LanguageTranslations;
                    description: LanguageTranslations;
                    easy: LanguageTranslations;
                    medium: LanguageTranslations;
                    hard: LanguageTranslations;
                    easyDescription: LanguageTranslations;
                    mediumDescription: LanguageTranslations;
                    hardDescription: LanguageTranslations;
                };
                datasheets: {
                    label: LanguageTranslations;
                    description: LanguageTranslations;
                };
                confirm: {
                    title: LanguageTranslations;
                    description: LanguageTranslations;
                }
            },
            buttons: {
                delete: LanguageTranslations;
                move: LanguageTranslations;
                moveHere: LanguageTranslations;
            },
            types: LanguageGameTypeTranslations<GameTypeEnum>;
            event: {
                messageChanged: (user: string, message: string) => MultiLingualString;
            }
        },
        profile: {
            description: LanguageTranslations;
            option: LanguageCommandOptionTranslations<ProfileCommandActionEnum>;
            labels: {
                title: LanguageTranslations;
                username: LanguageTranslations;
                badges: LanguageTranslations;
                position: LanguageTranslations;
                notRanked: LanguageTranslations;
                globalUserRank: (rank: number) => MultiLingualString;
                globalPoints: (points: number) => MultiLingualString;
                joinedAt: (joinedAt: Date) => MultiLingualString;
            };
        },
        settings: {
            description: LanguageTranslations;
            labels: {
                title: LanguageTranslations;
                description: LanguageTranslations;
                serverName: (serverName: string) => MultiLingualString;
                currentLanguage: (language: string) => MultiLingualString;
                gamesEnabled: (gamesEnabled: number) => MultiLingualString;
                changeLanguage: LanguageTranslations;
                languageChanged: LanguageTranslations;
                clickHereToChangeLanguage: LanguageTranslations;
            };
        },
        aboutme: {
            description: LanguageTranslations;
            labels: {
                title: LanguageTranslations;
                description: LanguageTranslations;
                github: LanguageTranslations;
                invite: LanguageTranslations;
                version: (version: string) => MultiLingualString;
            };
        },
        impersonate: {
            description: LanguageTranslations;
        },
        restartGame: {
            description: LanguageTranslations;
        },
        job: {
            description: LanguageTranslations;
        }
    }
    enums: {
        exceptions: LanguageEnumTranslations<ExceptionEnum>;
        languages: LanguageEnumTranslations<LanguageEnum>;
        metrics: LanguageEnumTranslations<MetricEnum>;
        userRoles: LanguageEnumTranslations<UserRoleEnum>;
    }
}