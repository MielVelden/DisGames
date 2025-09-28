import { GameActionEnum, GameActionPriorityEnum, GameEvent, GameFunctions, GameModule, GameOptionEnum } from "../../interfaces/domain/Game";
import { GameTypeEnum, LanguageEnum } from "../../interfaces/enums";
import { GameSettingsEnum } from "../../interfaces/enums";
import { DifficultyEnum } from "../../interfaces/enums";
import { i18n } from "../../utils/i18n/i18n";
import { MultiLingualString } from "../../interfaces/application/MultiLangualString";
import { GameSettingType } from "../../interfaces/domain/GameSettings";
import { GameDataModel, ServersModel } from "../../interfaces/database/TableInterfaces";
import { Component, Container } from "../../interfaces/application/Message";
import ComponentService from "../ComponentService";

function scrambleWord(word: string): string {
    const charArray = word.split("");
    for (let i = charArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [charArray[i], charArray[j]] = [charArray[j], charArray[i]];
    }
    return charArray.join("");
}

export default {
    config: {
        id: GameTypeEnum.ANAGRAM,
        emoji: "🔍",
        name: new MultiLingualString(i18n.commands.games.types[GameTypeEnum.ANAGRAM].name),
        description: new MultiLingualString(i18n.commands.games.types[GameTypeEnum.ANAGRAM].description),
        points: 1,
        isCalculated: false,
        expectedType: "string",
        addCorrectReaction: true,
        options: {
            [GameOptionEnum.IS_INACTIVE]: false,
            [GameOptionEnum.DISABLE_MESSAGE_CHANGE]: false,
            [GameOptionEnum.SAME_USER_DISABLED]: false,
            [GameOptionEnum.REMOVE_ON_WRONG_ANSWER]: false,
            [GameOptionEnum.ALLOW_SKIPPING]: true,
        },
        settings: [
            {
                key: GameSettingsEnum.DIFFICULTY,
                type: GameSettingType.ENUM,
                label: new MultiLingualString(i18n.commands.games.settings.difficulty.label),
                description: new MultiLingualString(i18n.commands.games.settings.difficulty.description),
                defaultValue: DifficultyEnum.MEDIUM,
                options: [
                    {
                        value: DifficultyEnum.EASY,
                        label: new MultiLingualString(i18n.commands.games.settings.difficulty.easy),
                        description: new MultiLingualString(i18n.commands.games.settings.difficulty.easyDescription)
                    },
                    {
                        value: DifficultyEnum.MEDIUM,
                        label: new MultiLingualString(i18n.commands.games.settings.difficulty.medium),
                        description: new MultiLingualString(i18n.commands.games.settings.difficulty.mediumDescription),
                        isDefault: true
                    },
                    {
                        value: DifficultyEnum.HARD,
                        label: new MultiLingualString(i18n.commands.games.settings.difficulty.hard),
                        description: new MultiLingualString(i18n.commands.games.settings.difficulty.hardDescription)
                    }
                ]
            }
        ]
    },

    functions: {
        validateAnswer(event: GameEvent): boolean {
            return event.userInput === event.getGameDataAnswer();
        },

        async getUpdatedGameAnswerAsync(event: GameEvent): Promise<void> {
            const nextAnswer = await event.getNextAnswerAsync();
            const nextAnswerMessage = nextAnswer[0].Response.getMessage(event.server.LanguageEnum);
            // Scramble the answer
            const scrambledMessage = scrambleWord(nextAnswerMessage);

            // Add the scrambled message to the event
            event.addAction({
                enum: GameActionEnum.COMPONENT,
                priority: GameActionPriorityEnum.HIGH,
                component: ComponentService.createContainer({
                    description: i18n.commands.games.types[GameTypeEnum.ANAGRAM].nextAnswer!(scrambledMessage)
                })
            });

            event.setGameDataAnswer(nextAnswerMessage);
        },

        async getStartComponentsAsync(gameData: GameDataModel[], server: ServersModel): Promise<Component[]> {
            return [ComponentService.createContainer({
                description: i18n.commands.games.types[GameTypeEnum.ANAGRAM].nextAnswer!(scrambleWord(gameData[0].Response.getMessage(server.LanguageEnum)))
            })];
        }
    } as GameFunctions
} as GameModule;