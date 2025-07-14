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
                wantToMoveChannel: LanguageTranslations;
                chooseChannel: LanguageTranslations;
                moveToThisChannel: LanguageTranslations;
                movedToChannel: (channel: string) => MultiLingualString;
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
            [LanguageEnum.EN]: "All set",
            [LanguageEnum.NL]: "Klaar",
        },
        cancel: {
            [LanguageEnum.EN]: "Dismiss",
            [LanguageEnum.NL]: "Annuleer",
        },
        timedOut: {
            [LanguageEnum.EN]: "Something went wrong, please try again",
            [LanguageEnum.NL]: "Er ging iets mis, probeer het opnieuw",
        },
        delete: {
            [LanguageEnum.EN]: "Remove",
            [LanguageEnum.NL]: "Verwijderen",
        }        
    },
    commands: {
        games: {
            description: {
                [LanguageEnum.EN]: "Easily configure and manage your games",
                [LanguageEnum.NL]: "Beheer en stel je spellen moeiteloos in",
            },
            option: {
                action: {
                    [LanguageEnum.EN]: "Action",
                    [LanguageEnum.NL]: "Actie",
                },
                actionDescription: {
                    [LanguageEnum.EN]: "Select how you’d like to manage your games",
                    [LanguageEnum.NL]: "Kies hoe je je spellen wilt beheren",
                },
                noAction: {
                    [LanguageEnum.EN]: "Please choose an action to continue",
                    [LanguageEnum.NL]: "Selecteer een actie om door te gaan",
                },
                choices: {
                    [GamesCommandActionEnum.MANAGE]: {
                        [LanguageEnum.EN]: "Manage games and settings",
                        [LanguageEnum.NL]: "Spellen en instellingen beheren",
                    },
                    [GamesCommandActionEnum.HELP]: {
                        [LanguageEnum.EN]: "Get help and support",
                        [LanguageEnum.NL]: "Hulp en ondersteuning",
                    },
                    [GamesCommandActionEnum.SETUP]: {
                        [LanguageEnum.EN]: "Set up new games",
                        [LanguageEnum.NL]: "Nieuwe spellen instellen",
                    }
                }
            },            
            labels: {
                success: {
                    [LanguageEnum.EN]: "Game setup complete",
                    [LanguageEnum.NL]: "Spel succesvol ingesteld",
                },
                nextNumber: (number: string) => new MultiLingualString({
                    [LanguageEnum.EN]: "Next number: {number}",
                    [LanguageEnum.NL]: "Volgend nummer: {number}",
                }, { number }),
                nextWord: (word: string) => new MultiLingualString({
                    [LanguageEnum.EN]: "Next word: {word}",
                    [LanguageEnum.NL]: "Volgend woord: {word}",
                }, { word }),
                selectGame: {
                    [LanguageEnum.EN]: "Choose a game",
                    [LanguageEnum.NL]: "Kies een spel",
                },
                wantToDelete: {
                    [LanguageEnum.EN]: "Are you sure you want to delete this game?",
                    [LanguageEnum.NL]: "Weet je zeker dat je dit spel wilt verwijderen?",
                },
                deleteSuccess: {
                    [LanguageEnum.EN]: "Game removed",
                    [LanguageEnum.NL]: "Spel verwijderd",
                },
                wantToMoveChannel: {
                    [LanguageEnum.EN]: "Move Channel",
                    [LanguageEnum.NL]: "Kanaal verplaatsen",
                },
                moveToThisChannel: {
                    [LanguageEnum.EN]: "Switch to this channel",
                    [LanguageEnum.NL]: "Overschakelen naar dit kanaal",
                },
                chooseChannel: {
                    [LanguageEnum.EN]: "Choose a channel",
                    [LanguageEnum.NL]: "Kies een kanaal",
                },
                movedToChannel: (channel: string) => new MultiLingualString({
                    [LanguageEnum.EN]: "Moved to {channel}",
                    [LanguageEnum.NL]: "Verplaatst naar {channel}",
                }, { channel }),
            },
            types: {
                [GameTypeEnum.COUNTING]: {
                    name: {
                        [LanguageEnum.EN]: "Counting",
                        [LanguageEnum.NL]: "Tellen",
                    },
                    description: {
                        [LanguageEnum.EN]: "Count the numbers in the messages",
                        [LanguageEnum.NL]: "Tel de getallen in de berichten",
                    },
                    startMessage: (firstAnswer: string) => new MultiLingualString({
                        [LanguageEnum.EN]: "Start with {firstAnswer}",
                        [LanguageEnum.NL]: "We beginnen met {firstAnswer}",
                    }, { firstAnswer }),
                },
                [GameTypeEnum.WORD_SNAKE]: {
                    name: {
                        [LanguageEnum.EN]: "Word Snake",
                        [LanguageEnum.NL]: "Woordslang",
                    },
                    description: {
                        [LanguageEnum.EN]: "Create a word snake",
                        [LanguageEnum.NL]: "Vorm een woordslang",
                    },
                    startMessage: (firstAnswer: string) => new MultiLingualString({
                        [LanguageEnum.EN]: "First letter: {firstAnswer}",
                        [LanguageEnum.NL]: "Eerste letter: {firstAnswer}",
                    }, { firstAnswer }),
                },
                [GameTypeEnum.ANAGRAM]: {
                    name: {
                        [LanguageEnum.EN]: "Anagram",
                        [LanguageEnum.NL]: "Anagram",
                    },
                    description: {
                        [LanguageEnum.EN]: "Unscramble the word",
                        [LanguageEnum.NL]: "Los het anagram op",
                    },
                    startMessage: (firstAnswer: string) => new MultiLingualString({
                        [LanguageEnum.EN]: "First letter: {firstAnswer}",
                        [LanguageEnum.NL]: "Eerste letter: {firstAnswer}",
                    }, { firstAnswer }),
                },
                [GameTypeEnum.NUMBER_GUESS]: {
                    name: {
                        [LanguageEnum.EN]: "Number Guess",
                        [LanguageEnum.NL]: "Getal raden",
                    },
                    description: {
                        [LanguageEnum.EN]: "Guess the hidden number",
                        [LanguageEnum.NL]: "Raad het verborgen getal",
                    },
                    startMessage: (firstAnswer: string) => new MultiLingualString({
                        [LanguageEnum.EN]: "First number: {firstAnswer}",
                        [LanguageEnum.NL]: "Eerste getal: {firstAnswer}",
                    }, { firstAnswer }),
                },
                [GameTypeEnum.TRIVIA_QUIZ]: {
                    name: {
                        [LanguageEnum.EN]: "Trivia Quiz",
                        [LanguageEnum.NL]: "Triviaquiz",
                    },
                    description: {
                        [LanguageEnum.EN]: "Answer trivia questions",
                        [LanguageEnum.NL]: "Beantwoord trivia-vragen",
                    },
                    startMessage: (firstAnswer: string) => new MultiLingualString({
                        [LanguageEnum.EN]: "First question: {firstAnswer}",
                        [LanguageEnum.NL]: "Eerste vraag: {firstAnswer}",
                    }, { firstAnswer }),
                },
                [GameTypeEnum.GUESS_THE_PRICE]: {
                    name: {
                        [LanguageEnum.EN]: "Guess the Price",
                        [LanguageEnum.NL]: "Raad de prijs",
                    },
                    description: {
                        [LanguageEnum.EN]: "Estimate the price of the item",
                        [LanguageEnum.NL]: "Raad de prijs van het product",
                    },
                    startMessage: (firstAnswer: string) => new MultiLingualString({
                        [LanguageEnum.EN]: "First price: {firstAnswer}",
                        [LanguageEnum.NL]: "Eerste prijs: {firstAnswer}",
                    }, { firstAnswer }),
                },
                [GameTypeEnum.MATH_QUIZ]: {
                    name: {
                        [LanguageEnum.EN]: "Math Quiz",
                        [LanguageEnum.NL]: "Rekenquiz",
                    },
                    description: {
                        [LanguageEnum.EN]: "Solve math problems",
                        [LanguageEnum.NL]: "Los rekenvragen op",
                    },
                    startMessage: (firstAnswer: string) => new MultiLingualString({
                        [LanguageEnum.EN]: "First problem: {firstAnswer}",
                        [LanguageEnum.NL]: "Eerste opgave: {firstAnswer}",
                    }, { firstAnswer }),
                },
                [GameTypeEnum.GUESS_THE_FLAG]: {
                    name: {
                        [LanguageEnum.EN]: "Guess the Flag",
                        [LanguageEnum.NL]: "Raad de Vlag",
                    },
                    description: {
                        [LanguageEnum.EN]: "Can you match the flag to the right country?",
                        [LanguageEnum.NL]: "Kun jij de vlag aan het juiste land koppelen?",
                    },
                    startMessage: (firstAnswer: string) => new MultiLingualString({
                        [LanguageEnum.EN]: "Let’s start, the first flag is: {firstAnswer}",
                        [LanguageEnum.NL]: "We beginnen, de eerste vlag is: {firstAnswer}",
                    }, { firstAnswer }),
                },                
            },
            event: {
                messageChanged: (user: string, message: string) => new MultiLingualString({
                    [LanguageEnum.EN]: "{user}: {message}",
                    [LanguageEnum.NL]: "{user}: {message}",
                }, { user, message }),
            },                                    
        },
    },
    exceptions: {
        [ExceptionEnum.GAME_ALREADY_EXISTS]: {
            [LanguageEnum.EN]: "This game already exists",
            [LanguageEnum.NL]: "Dit spel bestaat al",
        },
        [ExceptionEnum.CHANNEL_OR_SERVER_NOT_FOUND]: {
            [LanguageEnum.EN]: "We couldn’t find the channel or server",
            [LanguageEnum.NL]: "Kanaal of server niet gevonden",
        },
        [ExceptionEnum.ANSWER_ALREADY_EXISTS]: {
            [LanguageEnum.EN]: "You’ve already submitted an answer",
            [LanguageEnum.NL]: "Je hebt al een antwoord gegeven",
        },
        [ExceptionEnum.INVALID_GAME_TYPE]: {
            [LanguageEnum.EN]: "This game type isn’t supported",
            [LanguageEnum.NL]: "Dit speltype wordt niet ondersteund",
        },
        [ExceptionEnum.WANT_TO_REPLACE_CHANNEL]: {
            [LanguageEnum.EN]: "This channel is already set up. Do you want to replace it?",
            [LanguageEnum.NL]: "Dit kanaal is al ingesteld. Wil je het vervangen?",
        },
        [ExceptionEnum.WANT_TO_REPLACE_GAME]: {
            [LanguageEnum.EN]: "This game is already active. Do you want to replace it?",
            [LanguageEnum.NL]: "Dit spel is al actief. Wil je het vervangen?",
        },
        [ExceptionEnum.GAME_MODULE_NOT_FOUND]: {
            [LanguageEnum.EN]: "Game module couldn’t be found",
            [LanguageEnum.NL]: "Spelmodule niet gevonden",
        },
        [ExceptionEnum.SAME_USER_ALREADY_ANSWERED]: {
            [LanguageEnum.EN]: "You’ve already answered",
            [LanguageEnum.NL]: "Je hebt al een antwoord gegeven",
        },
        [ExceptionEnum.WRONG_ANSWER]: {
            [LanguageEnum.EN]: "That’s not the correct answer",
            [LanguageEnum.NL]: "Dat is niet het juiste antwoord",
        },
        [ExceptionEnum.GAME_NOT_ACTIVE]: {
            [LanguageEnum.EN]: "The game isn’t active right now",
            [LanguageEnum.NL]: "Het spel is momenteel niet actief",
        },
        [ExceptionEnum.MESSAGE_CHANGE_DISABLED]: {
            [LanguageEnum.EN]: "Editing messages is turned off",
            [LanguageEnum.NL]: "Berichten bewerken is uitgeschakeld",
        },
        [ExceptionEnum.INVALID_NUMBER]: {
            [LanguageEnum.EN]: "That doesn’t seem to be a valid number",
            [LanguageEnum.NL]: "Dat lijkt geen geldig nummer te zijn",
        }
    }    
};
