import { GamesCommandActionEnum } from "../../interfaces/enums/commands/Games";
import { LanguageEnum } from "../../interfaces/enums/database/LanguageEnum";
import { ExceptionEnum } from "../../interfaces/enums/domain/ExpectionEnum";
import { MultiLingualString } from "./MultiLangualString";

export type LanguageTranslations = {
    [LanguageEnum.EN]: string;
    [LanguageEnum.NL]: string;
    [LanguageEnum.ES]?: string;
    [LanguageEnum.DE]?: string;
};

export type ParameterizedTranslation = (...params: string[]) => MultiLingualString;

export type LanguageCommandOptionTranslations<T extends string | number> = {
    action: LanguageTranslations,
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

export interface I18nTranslations {
    common: {
        success: LanguageTranslations;
        cancel: LanguageTranslations;
    }
    commands: {
        games: {
            description: LanguageTranslations;
            option: LanguageCommandOptionTranslations<GamesCommandActionEnum>;
            setup: {
                success: LanguageTranslations;
                nextNumber: (number: string) => MultiLingualString;
            },
            event: {
                messageChanged: (user: string, message: string) => MultiLingualString;
            }
        }
    }
    exceptions: LanguageEnumTranslations<ExceptionEnum>;
}

export const i18n: I18nTranslations = {
    common: {
        success: {
            [LanguageEnum.EN]: "Success",
            [LanguageEnum.NL]: "Succes",
        },
        cancel: {
            [LanguageEnum.EN]: "Cancel",
            [LanguageEnum.NL]: "Annuleren",
        }
    },
    commands: {
        games: {
            description: {
                [LanguageEnum.EN]: "Manage games and their settings",
                [LanguageEnum.NL]: "Spellen en hun instellingen beheren",
            },
            option: {
                action: {
                    [LanguageEnum.EN]: "Manage games and their settings",
                    [LanguageEnum.NL]: "Spellen en hun instellingen beheren",
                },
                noAction: {
                    [LanguageEnum.EN]: "You must select an action",
                    [LanguageEnum.NL]: "Je moet een actie selecteren",
                },
                choices: {
                    [GamesCommandActionEnum.MANAGE]: {
                        [LanguageEnum.EN]: "Manage games and their settings",
                        [LanguageEnum.NL]: "Spellen en hun instellingen beheren",
                    },
                    [GamesCommandActionEnum.HELP]: {
                        [LanguageEnum.EN]: "Help and support",
                        [LanguageEnum.NL]: "Help en ondersteuning",
                    },
                    [GamesCommandActionEnum.SETUP]: {
                        [LanguageEnum.EN]: "Setup games",
                        [LanguageEnum.NL]: "Spellen instellen",
                    }
                }
            },
            setup: {
                success: {
                    [LanguageEnum.EN]: "Game setup successfully",
                    [LanguageEnum.NL]: "Spel instellingen succesvol opgeslagen",
                },
                nextNumber: (number: string) => new MultiLingualString({
                    [LanguageEnum.EN]: "Next number is {number}",
                    [LanguageEnum.NL]: "Volgend nummer is {number}",
                }, { number }),
            },
            event: {
                messageChanged: (user: string, message: string) => new MultiLingualString({
                    [LanguageEnum.EN]: "{user}: {message}",
                    [LanguageEnum.NL]: "{user}: {message}",
                }, { user, message }),
            }
        },
    },
    exceptions: {
        [ExceptionEnum.GAME_ALREADY_EXISTS]: {
            [LanguageEnum.EN]: "Game already exists",
            [LanguageEnum.NL]: "Spel bestaat al",
        },
        [ExceptionEnum.CHANNEL_OR_SERVER_NOT_FOUND]: {
            [LanguageEnum.EN]: "Channel or server not found",
            [LanguageEnum.NL]: "Kanaal of server niet gevonden",
        },
        [ExceptionEnum.ANSWER_ALREADY_EXISTS]: {
            [LanguageEnum.EN]: "Answer already exists",
            [LanguageEnum.NL]: "Antwoord bestaat al",
        },
        [ExceptionEnum.INVALID_GAME_TYPE]: {
            [LanguageEnum.EN]: "Invalid game type",
            [LanguageEnum.NL]: "Ongeldig speltype",
        },
        [ExceptionEnum.WANT_TO_REPLACE_CHANNEL]: {
            [LanguageEnum.EN]: "The channel is already set up in this server. Do you want to replace it?",
            [LanguageEnum.NL]: "Het kanaal is al ingesteld in deze server. Wil je het vervangen?",
        },
        [ExceptionEnum.WANT_TO_REPLACE_GAME]: {
            [LanguageEnum.EN]: "The game is already set up in this channel or server. Do you want to replace it?",
            [LanguageEnum.NL]: "Het spel is al ingesteld in dit kanaal of server. Wil je het vervangen?",
        },
        [ExceptionEnum.GAME_MODULE_NOT_FOUND]: {
            [LanguageEnum.EN]: "Game module not found",
            [LanguageEnum.NL]: "Spelmodule niet gevonden",
        },
        [ExceptionEnum.SAME_USER_ALREADY_ANSWERED]: {
            [LanguageEnum.EN]: "You have already answered",
            [LanguageEnum.NL]: "Je hebt al een antwoord gegeven",
        },
        [ExceptionEnum.WRONG_ANSWER]: {
            [LanguageEnum.EN]: "Wrong answer",
            [LanguageEnum.NL]: "Fout antwoord",
        },
        [ExceptionEnum.GAME_NOT_ACTIVE]: {
            [LanguageEnum.EN]: "Game is not active",
            [LanguageEnum.NL]: "Spel is niet actief",
        },
        [ExceptionEnum.MESSAGE_CHANGE_DISABLED]: {
            [LanguageEnum.EN]: "Message change is disabled",
            [LanguageEnum.NL]: "Bericht wijziging is uitgeschakeld",
        }
    }
};
