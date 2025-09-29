import { ExceptionEnum } from "../enums";
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
    }
};

export type LanguageGameTypeTranslations<T extends GameTypeEnum> = {
    [K in T]: {
        name: LanguageTranslations;
        description: LanguageTranslations;
        longDescription: LanguageTranslations;
        howToPlay: LanguageTranslations;
        startMessage: (firstAnswer: string) => MultiLingualString;
        nextAnswer?: (nextAnswer?: string | number) => MultiLingualString;
        start?: () => MultiLingualString;
        incorrectAnswer?: () => MultiLingualString;
        gameComplete?: () => MultiLingualString;
    }
}

export interface I18nTranslations {
    common: {
        success: LanguageTranslations;
        cancel: LanguageTranslations;
        accept: LanguageTranslations;
        deny: LanguageTranslations;
        cancelled: LanguageTranslations;
        timedOut: LanguageTranslations;
        delete: LanguageTranslations;
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
                selectGame: LanguageTranslations;
                deleteSuccess: LanguageTranslations;
                chooseChannel: LanguageTranslations;
                confirmSetupTitle: LanguageTranslations;
                confirmSetupDescription: (gameName: string, channelName: string) => MultiLingualString;
                movedToChannel: (channel: string) => MultiLingualString;
                skipAnswer: LanguageTranslations;
                howToPlay: LanguageTranslations;
                incorrectAnswer: LanguageTranslations;
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
                    label: LanguageTranslations;
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
            }
        }
    }
    exceptions: LanguageEnumTranslations<ExceptionEnum>;
}