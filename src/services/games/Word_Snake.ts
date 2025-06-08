import { GameActionEnum, GameActionPriorityEnum, GameEvent, GameModule, GameOptionEnum } from "../../interfaces/domain/Game";
import { GameTypeEnum } from "../../interfaces/enums";
import { i18n } from "../../utils/i18n/i18n";
import { MultiLingualString } from "../../utils/i18n/MultiLangualString";

export default {
    config: {
        id: GameTypeEnum.WORD_SNAKE,
        emoji: "🐍",
        name: new MultiLingualString(i18n.commands.games.types[GameTypeEnum.WORD_SNAKE].name),
        description: new MultiLingualString(i18n.commands.games.types[GameTypeEnum.WORD_SNAKE].description),
        points: 1,
        expectedType: "string",
        firstAnswer: "e",
        options: {
            [GameOptionEnum.DISABLE_MESSAGE_CHANGE]: true,
            [GameOptionEnum.REMOVE_ON_WRONG_ANSWER]: true,
            [GameOptionEnum.SAME_USER_DISABLED]: true,
        }
    },

    functions: {
        validateAnswer(event: GameEvent): boolean {
            return typeof event.answer === 'string' && 
                   typeof event.gameData.Answer === 'string' &&
                   event.answer.toLowerCase().charAt(0) === event.gameData.Answer.toLowerCase();
        },

        processAnswer(event: GameEvent): void {
            event.addAction({
                enum: GameActionEnum.REACTION,
                priority: GameActionPriorityEnum.HIGH,
                component: "✅"
            })
        },

        getNextAnswerAsync(event: GameEvent): void {
            if (!event.answer) return;
            const lastLetter = event.answer.toString().toLowerCase().charAt(event.answer.toString().length - 1);
            event.gameData.Answer = lastLetter;
        }
    }
} as GameModule;