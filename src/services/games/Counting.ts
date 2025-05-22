import { ComponentType } from "../../interfaces/application/Message";
import { GameActionEnum, GameActionPriorityEnum, GameEvent, GameModule, GameOptionEnum, GameType } from "../../interfaces/domain/Game";

export default {
    config: {
        id: GameType.COUNTING,
        name: "Counting",
        description: "Start counting with each other",
        points: 1,
        expectedType: "number",
        options: {
            [GameOptionEnum.IS_ACTIVE]: true,
            [GameOptionEnum.ALLOW_MESSAGE_CHANGE]: false,
            [GameOptionEnum.REACT]: true,
            [GameOptionEnum.SAME_USER_ALLOWED]: false,
        }
    },

    functions: {
        validateAnswer(event: GameEvent): boolean {
            return event.answer === event.gameData.answer;
        },

        processAnswer(event: GameEvent): void {
            event.addAction({
                enum: GameActionEnum.REACTION,
                priority: GameActionPriorityEnum.HIGH,
                component: "✅"
            })
        },

        getNextAnswer(event: GameEvent): void {
            event.gameData.answer = (event.gameData.answer as number) + 1;
        }
    }
} as GameModule;