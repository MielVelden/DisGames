import { GameActionEnum, GameActionPriorityEnum, GameFunctions, GameModule, GameOptionEnum } from "../../interfaces/domain/Game";
import { GameEvent } from "../events/GameEvent";
import { GameTypeEnum } from "../../interfaces/enums";
import { i18n } from "../../utils/i18n/i18n";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";
import ComponentService from "../application/ComponentService";
import { GameDataModel, ServersModel } from "../../interfaces/database/TableInterfaces";
import { Component } from "../../interfaces/application/Message";
import { compareStrings } from "../../utils/helpers/String";
import { DEFAULT_WRONG_ANSWER_EMOJI } from "../../utils/constants/Emojis";

export default {
    config: {
        id: GameTypeEnum.TRIVIA_QUIZ,
        emoji: "❓",
        name: new MultiLingualString(i18n.commands.games.types[GameTypeEnum.TRIVIA_QUIZ].name),
        description: new MultiLingualString(i18n.commands.games.types[GameTypeEnum.TRIVIA_QUIZ].description),
        points: 1,
        isCalculated: false,
        expectedType: "string",
        addCorrectReaction: true,
        options: {
            [GameOptionEnum.ALLOW_SKIPPING]: true,
        }
    },

    functions: {
        validateAnswer(event: GameEvent): boolean {
            return compareStrings(event.userInput as string, event.getGameDataAnswer());
        },

        async getUpdatedGameAnswerAsync(event: GameEvent): Promise<void> {
            const nextAnswer = await event.getNextAnswerAsync();
            const nextQuestion = nextAnswer[0].Message;
            const nextAnswerMessage = nextAnswer[0].Response.getMessage(event.server.LanguageEnum);
            event.addAction({
                enum: GameActionEnum.COMPONENT,
                priority: GameActionPriorityEnum.HIGH,
                component: ComponentService.createContainer({
                    title: new MultiLingualString(i18n.commands.games.types[GameTypeEnum.TRIVIA_QUIZ].name),
                    description: nextQuestion,
                    footer: new MultiLingualString(i18n.commands.games.labels.skipAnswer)
                })
            })

            event.setGameDataAnswer(nextAnswerMessage);
        },

        async getStartComponentsAsync(gameData: GameDataModel[], server: ServersModel): Promise<Component[]> {
            const firstQuestion = gameData[0].Message.getMessage(server.LanguageEnum);
            return [
                ComponentService.createContainer({
                    description: i18n.commands.games.types[GameTypeEnum.TRIVIA_QUIZ].startMessage(firstQuestion)
                })];
        },

        async onIncorrectAnswerAsync(event: GameEvent): Promise<void> {
            event.addAction({
                enum: GameActionEnum.REACTION,
                priority: GameActionPriorityEnum.HIGH,
                component: DEFAULT_WRONG_ANSWER_EMOJI
            })
        }
    } as GameFunctions
} as GameModule;