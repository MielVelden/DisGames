import { GameActionEnum, GameActionPriorityEnum, GameFunctions, GameModule, GameOptionEnum } from "../../interfaces/domain/Game";
import { GameEvent } from "../events/GameEvent";
import { GameTypeEnum } from "../../interfaces/enums";
import { GameSettingsEnum } from "../../interfaces/enums";
import { DifficultyEnum } from "../../interfaces/enums";
import { i18n } from "../../utils/i18n/i18n";
import { createMultiLingualString, MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { GameSettingType } from "../../interfaces/domain/GameSettings";
import { GameDataModel, ServersModel } from "../../interfaces/database/TableInterfaces";
import { Component } from "../../interfaces/application/Message";
import ComponentService from "../application/ComponentService";
import { compareStrings } from "../../utils/helpers/String";
import { createBlock } from "../../utils/helpers/Markdown";
import { getRejectEmoji } from "../../utils/constants/Emojis";

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
        name: new MultiLingualString(i18n.enums.gameTypes[GameTypeEnum.ANAGRAM].name),
        description: new MultiLingualString(i18n.enums.gameTypes[GameTypeEnum.ANAGRAM].description),
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
                disabled: true,
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
            return compareStrings(event.userInput as string, event.getGameDataAnswer());
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
                component: [
                    ComponentService.createContent(createBlock(createMultiLingualString(scrambledMessage))),
                ]
            });

            event.setGameDataAnswer(nextAnswerMessage);
        },

        async getStartComponentsAsync(gameData: GameDataModel[], server: ServersModel): Promise<Component[]> {
            return [
                ComponentService.createContent(createBlock(createMultiLingualString(scrambleWord(gameData[0].Response.getMessage(server.LanguageEnum))))),
            ];
        },

        async onIncorrectAnswerAsync(event: GameEvent): Promise<void> {
            event.addAction({
                enum: GameActionEnum.REACTION,
                priority: GameActionPriorityEnum.HIGH,
                component: getRejectEmoji(event.server.Settings)
            })
        }
    } as GameFunctions
} as GameModule;