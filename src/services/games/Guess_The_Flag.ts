import { GameActionEnum, GameActionPriorityEnum, GameEvent, GameFunctions, GameModule, GameOptionEnum } from "../../interfaces/domain/Game";
import { GameTypeEnum } from "../../interfaces/enums";
import { i18n } from "../../utils/i18n/i18n";
import { MultiLingualString } from "../../interfaces/application/MultiLangualString";
import ComponentService from "../ComponentService";
import MediaService from "../MediaService";

export default {
    config: {
        id: GameTypeEnum.GUESS_THE_FLAG,
        emoji: "🏳️",
        name: new MultiLingualString(i18n.commands.games.types[GameTypeEnum.GUESS_THE_FLAG].name),
        description: new MultiLingualString(i18n.commands.games.types[GameTypeEnum.GUESS_THE_FLAG].description),
        points: 1,
        isCalculated: false,
        expectedType: "string",
        addCorrectReaction: true,
        hasImages: true,
        options: {
            [GameOptionEnum.ALLOW_SKIPPING]: true,
        }
    },

    functions: {
        validateAnswer(event: GameEvent): boolean {
            return event.userInput === event.getGameDataAnswer();
        },

        async getUpdatedGameAnswerAsync(event: GameEvent): Promise<void> {
            const nextAnswer = await event.getNextAnswerAsync();
            const nextAnswerMessage = nextAnswer[0].Response.getMessage(event.server.LanguageEnum);
            event.addAction({
                enum: GameActionEnum.COMPONENT,
                priority: GameActionPriorityEnum.HIGH,
                component: ComponentService.createContainer({
                    title: new MultiLingualString(i18n.commands.games.types[GameTypeEnum.GUESS_THE_FLAG].name),
                    description: new MultiLingualString(i18n.commands.games.labels.skipAnswer)
                })
            })

            event.setGameDataAnswer(nextAnswerMessage);
        }
    } as GameFunctions
} as GameModule;