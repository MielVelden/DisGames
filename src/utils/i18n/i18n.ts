import { GameTypeEnum } from "../../interfaces/enums";
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

export type LanguageGameTypeTranslations<T extends GameTypeEnum> = {
    [K in T]: {
        name: LanguageTranslations;
        description: LanguageTranslations;
        startMessage: (firstAnswer: string) => MultiLingualString;
    }
}

export interface I18nTranslations {
    common: {
        success: LanguageTranslations;
        cancel: LanguageTranslations;
        timedOut: LanguageTranslations;
        delete: LanguageTranslations;
    }
    commands: {
        games: {
            description: LanguageTranslations;
            option: LanguageCommandOptionTranslations<GamesCommandActionEnum>;
            labels: {
                success: LanguageTranslations;
                nextNumber: (number: string) => MultiLingualString;
                nextWord: (word: string) => MultiLingualString;
                selectGame: LanguageTranslations;
                wantToDelete: LanguageTranslations;
                deleteSuccess: LanguageTranslations;
                moveToThisChannel: LanguageTranslations;
            },
            types: LanguageGameTypeTranslations<GameTypeEnum>;
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
        },
        timedOut: {
            [LanguageEnum.EN]: "Interaction timed out",
            [LanguageEnum.NL]: "Interactie is verlopen",
        },
        delete: {
            [LanguageEnum.EN]: "Delete",
            [LanguageEnum.NL]: "Verwijder",
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
            labels: {
                success: {
                    [LanguageEnum.EN]: "Game setup successfully",
                    [LanguageEnum.NL]: "Spel instellingen succesvol opgeslagen",
                },
                nextNumber: (number: string) => new MultiLingualString({
                    [LanguageEnum.EN]: "Next number is {number}",
                    [LanguageEnum.NL]: "Volgend nummer is {number}",
                }, { number }),
                nextWord: (word: string) => new MultiLingualString({
                    [LanguageEnum.EN]: "Next word is {word}",
                    [LanguageEnum.NL]: "Volgend woord is {word}",
                }, { word }),
                selectGame: {
                    [LanguageEnum.EN]: "Select a game",
                    [LanguageEnum.NL]: "Selecteer een spel",
                },
                wantToDelete: {
                    [LanguageEnum.EN]: "Do you want to delete this game?",
                    [LanguageEnum.NL]: "Wil je dit spel verwijderen?",
                },
                deleteSuccess: {
                    [LanguageEnum.EN]: "Game deleted successfully",
                    [LanguageEnum.NL]: "Spel succesvol verwijderd",
                },
                moveToThisChannel: {
                    [LanguageEnum.EN]: "Move to this channel",
                    [LanguageEnum.NL]: "Verplaats naar dit kanaal",
                }
            },
            types: {
                [GameTypeEnum.COUNTING]: {
                    name: {
                        [LanguageEnum.EN]: "Counting",
                        [LanguageEnum.NL]: "Telling",
                    },
                    description: {
                        [LanguageEnum.EN]: "Count the numbers in the message",
                        [LanguageEnum.NL]: "Tel de nummers in het bericht",
                    },
                    startMessage: (firstAnswer: string) => new MultiLingualString({
                        [LanguageEnum.EN]: "The first number is {firstAnswer}",
                        [LanguageEnum.NL]: "Het eerste nummer is {firstAnswer}",
                    }, { firstAnswer }),
                },
                [GameTypeEnum.WORD_SNAKE]: {
                    name: {
                        [LanguageEnum.EN]: "Word Snake",
                        [LanguageEnum.NL]: "Woord slang",
                    },
                    description: {
                        [LanguageEnum.EN]: "Make a word snake",
                        [LanguageEnum.NL]: "Maak een woord slang",
                    },
                    startMessage: (firstAnswer: string) => new MultiLingualString({
                        [LanguageEnum.EN]: "The first letter is {firstAnswer}",
                        [LanguageEnum.NL]: "Het eerste letter is {firstAnswer}",
                    }, { firstAnswer }),
                },
                [GameTypeEnum.ANAGRAM]: {
                    name: {
                        [LanguageEnum.EN]: "Anagram",
                        [LanguageEnum.NL]: "Anagram",
                    },
                    description: {
                        [LanguageEnum.EN]: "Guess the anagram of the word",
                        [LanguageEnum.NL]: "Gok het anagram van het woord",
                    },
                    startMessage: (firstAnswer: string) => new MultiLingualString({
                        [LanguageEnum.EN]: "The first letter is {firstAnswer}",
                        [LanguageEnum.NL]: "Het eerste letter is {firstAnswer}",
                    }, { firstAnswer }),
                },
                [GameTypeEnum.NUMBER_GUESS]: {
                    name: {
                        [LanguageEnum.EN]: "Number Guess",
                        [LanguageEnum.NL]: "Getal raden",
                    },
                    description: {
                        [LanguageEnum.EN]: "Guess the number",
                        [LanguageEnum.NL]: "Gok het nummer",
                    },
                    startMessage: (firstAnswer: string) => new MultiLingualString({
                        [LanguageEnum.EN]: "The first number is {firstAnswer}",
                        [LanguageEnum.NL]: "Het eerste nummer is {firstAnswer}",
                    }, { firstAnswer }),
                },
                [GameTypeEnum.TRIVIA_QUIZ]: {
                    name: {
                        [LanguageEnum.EN]: "Trivia Quiz",
                        [LanguageEnum.NL]: "Trivia quiz",
                    },
                    description: {
                        [LanguageEnum.EN]: "Answer the trivia questions",
                        [LanguageEnum.NL]: "Beantwoord de trivia vragen",
                    },
                    startMessage: (firstAnswer: string) => new MultiLingualString({
                        [LanguageEnum.EN]: "The first question is {firstAnswer}",
                        [LanguageEnum.NL]: "De eerste vraag is {firstAnswer}",
                    }, { firstAnswer }),
                },
                [GameTypeEnum.GUESS_THE_PRICE]: {
                    name: {
                        [LanguageEnum.EN]: "Guess the price",
                        [LanguageEnum.NL]: "Gok de prijs",
                    },
                    description: {
                        [LanguageEnum.EN]: "Guess the price of the item",
                        [LanguageEnum.NL]: "Gok de prijs van het item",
                    },
                    startMessage: (firstAnswer: string) => new MultiLingualString({
                        [LanguageEnum.EN]: "The first price is {firstAnswer}",
                        [LanguageEnum.NL]: "De eerste prijs is {firstAnswer}",
                    }, { firstAnswer }),
                },
                [GameTypeEnum.MATH_QUIZ]: {
                    name: {
                        [LanguageEnum.EN]: "Math Quiz",
                        [LanguageEnum.NL]: "Wiskunde quiz",
                    },
                    description: {
                        [LanguageEnum.EN]: "Solve the math problem",
                        [LanguageEnum.NL]: "Los de wiskunde opgave op",
                    },
                    startMessage: (firstAnswer: string) => new MultiLingualString({
                        [LanguageEnum.EN]: "The first math problem is {firstAnswer}",
                        [LanguageEnum.NL]: "De eerste wiskunde opgave is {firstAnswer}",
                    }, { firstAnswer }),
                },
                [GameTypeEnum.GUESS_THE_FLAG]: {
                    name: {
                        [LanguageEnum.EN]: "Guess the flag",
                        [LanguageEnum.NL]: "Gok het vlag",
                    },
                    description: {
                        [LanguageEnum.EN]: "Guess the flag of the country",
                        [LanguageEnum.NL]: "Gok de vlag van het land",
                    },
                    startMessage: (firstAnswer: string) => new MultiLingualString({
                        [LanguageEnum.EN]: "The first flag is {firstAnswer}",
                        [LanguageEnum.NL]: "De eerste vlag is {firstAnswer}",
                    }, { firstAnswer }),
                }
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
