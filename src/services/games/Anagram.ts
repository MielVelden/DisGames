import { GameActionEnum, GameActionPriorityEnum, GameEvent, GameFunctions, GameModule, GameOptionEnum } from "../../interfaces/domain/Game";
import { GameTypeEnum } from "../../interfaces/enums";
import ComponentService from "../ComponentService";
import { i18n } from "../../utils/i18n/i18n";
import GameDataService from "../GameDataService";
import { MultiLingualString } from "../../utils/i18n/MultiLangualString";

export default {
    config: {
        id: GameTypeEnum.ANAGRAM,
        emoji: "🔍",
        name: new MultiLingualString(i18n.commands.games.types[GameTypeEnum.ANAGRAM].name),
        description: new MultiLingualString(i18n.commands.games.types[GameTypeEnum.ANAGRAM].description),
        points: 1,
        expectedType: "string",
        addCorrectReaction: true,
        options: {
            [GameOptionEnum.ALLOW_SKIPPING]: true,
        }
    },

    functions: {
        validateAnswer(event: GameEvent): boolean {
            return event.answer === event.gameData.Answer;
        },

        async getNextAnswerAsync(event: GameEvent): Promise<void> {
            const newAnswer = await GameDataService.getGameDataAsync(event.gameConfig.id, event.server.LanguageEnum);
            const nextAnswer = newAnswer.Response.getMessage(event.server.LanguageEnum);
            // Scramble the answer
            const charArray = nextAnswer.split("");
            for (let i = charArray.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [charArray[i], charArray[j]] = [charArray[j], charArray[i]];
            }
            const scrambledMessage = charArray.join("");

            // Add the scrambled message to the event
            event.addAction({
                enum: GameActionEnum.COMPONENT,
                priority: GameActionPriorityEnum.HIGH,
                component: ComponentService.createContent(i18n.commands.games.labels.nextWord(scrambledMessage))
            })

            event.gameData.Answer = nextAnswer;
        }
    } as GameFunctions
} as GameModule;