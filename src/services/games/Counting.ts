import { GameActionEnum, GameActionPriorityEnum, GameEvent, GameModule, GameOptionEnum } from "../../interfaces/domain/Game";
import { GameTypeEnum } from "../../interfaces/enums";
import { i18n } from "../../utils/i18n/i18n";
import { MultiLingualString } from "../../utils/i18n/MultiLangualString";

export default {
    config: {
        id: GameTypeEnum.COUNTING,
        name: new MultiLingualString(i18n.commands.games.types[GameTypeEnum.COUNTING].name),
        description: new MultiLingualString(i18n.commands.games.types[GameTypeEnum.COUNTING].description),
        points: 1,
        expectedType: "number",
        firstAnswer: "1",
        options: {
            [GameOptionEnum.DISABLE_MESSAGE_CHANGE]: true,
            [GameOptionEnum.REMOVE_ON_WRONG_ANSWER]: true,
            [GameOptionEnum.SAME_USER_DISABLED]: true,
        }
    },

    functions: {
        validateAnswer(event: GameEvent): boolean {
            return event.answer === Number(event.gameData.Answer);
        },

        processAnswer(event: GameEvent): void {
            event.addAction({
                enum: GameActionEnum.REACTION,
                priority: GameActionPriorityEnum.HIGH,
                component: "✅"
            })
        },

        getNextAnswerAsync(event: GameEvent): void {
            event.gameData.Answer = (Number(event.gameData.Answer) + 1).toString();
        }
    }
} as GameModule;