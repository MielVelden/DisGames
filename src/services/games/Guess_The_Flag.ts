import { GameActionEnum, GameActionPriorityEnum, GameEvent, GameFunctions, GameModule, GameOptionEnum } from "../../interfaces/domain/Game";
import { GameTypeEnum } from "../../interfaces/enums";
import ComponentService from "../ComponentService";
import { i18n } from "../../utils/i18n/i18n";
import GameDataService from "../GameDataService";
import { MultiLingualString } from "../../utils/i18n/MultiLangualString";

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
            return event.answer === event.gameData.Answer;
        },

        async getNextAnswerAsync(event: GameEvent): Promise<void> {
            event.gameData.Answer = event.nextAnswer!.Response.getMessage(event.server.LanguageEnum);
        }
    } as GameFunctions
} as GameModule;