import { ExceptionEnum, MetricEnum, UserRoleEnum } from "../enums";
import { GamesCommandActionEnum } from "../enums/commands/Games";
import { PremiumActionEnum } from "../enums/commands/Premium";
import { ProfileCommandActionEnum } from "../enums/commands/Profile";
import { GameTypeEnum } from "../enums/database/GameTypeEnum";
import { LanguageEnum } from "../enums/database/LanguageEnum";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { BadgeEnum } from "../enums/application/BadgeEnum";

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
    [K in T]: LanguageTranslations
};

export type ExceptionTranslationParams = {
    [ExceptionEnum.TABLE_ENUM_NOT_FOUND]: { tableEnumValue: string };
    [ExceptionEnum.ENV_VARIABLE_NOT_SET]: { environmentVariable: string };
    [ExceptionEnum.FUNCTION_RETURNED_INVALID_RESULT]: { functionName: string };
    [ExceptionEnum.JOB_NOT_FOUND]: { jobId: string };
    [ExceptionEnum.CLIENT_NOT_FOUND]: { clientId: string };
    [ExceptionEnum.FIELD_IS_NULL]: { field: string };
    [ExceptionEnum.FIELD_IS_MISSING_AND_REQUIRED]: { key: string };
    [ExceptionEnum.FIELD_HAS_INVALID_TYPE]: { key: string; received: string; expected: string };
    [ExceptionEnum.FIELD_HAS_INVALID_VALUE]: { key: string };
    [ExceptionEnum.TABLE_NOT_FOUND]: { tableName: string };
    [ExceptionEnum.NON_PREMIUM_GAME_LIMIT_REACHED]: { limit: number };
};

export type LanguageExceptionTranslations = {
    [K in ExceptionEnum]: K extends keyof ExceptionTranslationParams
        ? (params: ExceptionTranslationParams[K]) => MultiLingualString
        : LanguageTranslations;
};

export type BadgeTranslationParams = {
    [BadgeEnum.DAY_STREAK]: { days: number };
    [BadgeEnum.GAMES_PLAYED]: { count: number };
    [BadgeEnum.POINT_COLLECTOR]: { points: number };
    [BadgeEnum.VETERAN]: { days: number };
    [BadgeEnum.WORLD_TRAVELER]: { servers: number };
};

export type LanguageBadgeTranslations = {
    [K in BadgeEnum]: K extends keyof BadgeTranslationParams
        ? {
            title: (params: BadgeTranslationParams[K]) => MultiLingualString;
            description: (params: BadgeTranslationParams[K]) => MultiLingualString;
          }
        : {
            title: LanguageTranslations;
            description: LanguageTranslations;
          };
};

export type LanguageAchievementEnumTranslations<T extends string | number> = {
    [K in T]: {
        title: LanguageTranslations,
        description: LanguageTranslations
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
                selectedCount: (count: number) => MultiLingualString;
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
            event: {
                messageChanged: (user: string, message: string) => MultiLingualString;
            }
        },
        profile: {
            description: LanguageTranslations;
            loadingTitle: LanguageTranslations;
            loadingProfile: LanguageTranslations;
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
                memberSince: (date: string) => MultiLingualString;
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
                changeEmojis: LanguageTranslations;
                emojisChanged: LanguageTranslations;
                emojiModalTitle: LanguageTranslations;
                acceptEmojiLabel: LanguageTranslations;
                rejectEmojiLabel: LanguageTranslations;
                invalidEmoji: LanguageTranslations;
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
        },
        premium: {
            description: LanguageTranslations;
            option: LanguageCommandOptionTranslations<PremiumActionEnum>;
            optionTarget: LanguageCommandOptionTranslations<never>;
            labels: {
                created: LanguageTranslations;
                deleted: LanguageTranslations;
                missingSku: LanguageTranslations;
                missingTarget: LanguageTranslations;
                missingGuild: LanguageTranslations;
                clientNotReady: LanguageTranslations;
                toggledOn: LanguageTranslations;
                toggledOff: LanguageTranslations;
                purchaseButtonEnabled: LanguageTranslations;
                purchaseButtonDisabled: LanguageTranslations;
            };
        },
        handoff: {
            description: LanguageTranslations;
            labels: {
                activated: LanguageTranslations;
                shuttingDown: LanguageTranslations;
            };
        },
        generateData: {
            description: LanguageTranslations;
            labels: {
                generating: LanguageTranslations;
                translating: LanguageTranslations;
                generateSummary: (generated: number, skipped: number, failed: number) => MultiLingualString;
                translateSummary: (translated: number, skipped: number, failed: number) => MultiLingualString;
                unknownSubcommand: LanguageTranslations;
                unknownGameType: LanguageTranslations;
            };
        }
    }
    enums: {
        badges: LanguageBadgeTranslations;
        gameTypes: LanguageGameTypeTranslations<GameTypeEnum>;
        exceptions: LanguageExceptionTranslations;
        languages: LanguageEnumTranslations<LanguageEnum>;
        metrics: LanguageEnumTranslations<MetricEnum>;
        userRoles: LanguageEnumTranslations<UserRoleEnum>;
    }
}