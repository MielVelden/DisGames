import { GameFunctions, GameModule, GameOptionEnum } from "../../interfaces/domain/Game";
import { GameEvent } from "../events/GameEvent";
import { GameTypeEnum } from "../../interfaces/enums";
import { i18n } from "../../utils/i18n/i18n";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { compareStrings } from "../../utils/helpers/String";

export default {
    config: {
        id: GameTypeEnum.WORD_SNAKE,
        emoji: "🐍",
        name: new MultiLingualString(i18n.commands.games.types[GameTypeEnum.WORD_SNAKE].name),
        description: new MultiLingualString(i18n.commands.games.types[GameTypeEnum.WORD_SNAKE].description),
        points: 1,
        isCalculated: true,
        expectedType: "string",
        firstAnswer: "e",
        addCorrectReaction: true,
        options: {
            [GameOptionEnum.DISABLE_MESSAGE_CHANGE]: true,
            [GameOptionEnum.REMOVE_ON_WRONG_ANSWER]: true,
            [GameOptionEnum.SAME_USER_DISABLED]: true,
        }
    },

    functions: {
        validateAnswer(event: GameEvent): boolean {
            if (typeof event.userInput != 'string' || typeof event.getGameDataAnswer() != 'string')
                return false;

            const input = event.userInput.trim();

            if (input.length <= 1)
                return false;

            if (!/^[A-Za-z]+$/.test(input))
                return false;

            return compareStrings(input.charAt(0), event.getGameDataAnswer());
        },

        async getUpdatedGameAnswerAsync(event: GameEvent): Promise<void> {
            if (!event.userInput)
                return;
            const lastAnswer = event.userInput.toString().toLowerCase();
            const lastLetter = lastAnswer.charAt(lastAnswer.length - 1);
            event.setGameDataAnswer(lastLetter);
        }
    } as GameFunctions
} as GameModule;