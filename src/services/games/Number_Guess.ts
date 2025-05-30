import { GameActionEnum, GameActionPriorityEnum, GameEvent, GameModule, GameOptionEnum } from "../../interfaces/domain/Game";
import { GameTypeEnum } from "../../interfaces/enums";

const MAX_NUMBER = 100;

export default {
    config: {
        id: GameTypeEnum.NUMBER_GUESS,
        name: "NumberGuess",
        description: "Raad het juiste getal tussen 1 en 100",
        points: 1,
        expectedType: "number",
        options: {
            [GameOptionEnum.IS_ACTIVE]: true,
            [GameOptionEnum.ALLOW_MESSAGE_CHANGE]: false
        }
    },

    functions: {
        validateAnswer(event: GameEvent): boolean {
            return Number(event.answer) === Number(event.gameData.Answer);
        },

        processAnswer(event: GameEvent): void {
            event.addAction({
                enum: GameActionEnum.REACTION,
                priority: GameActionPriorityEnum.HIGH,
                component: "✅"
            })
        },

        getNextAnswer(event: GameEvent): void {
            event.gameData.Answer = (Math.floor(Math.random() * MAX_NUMBER) + 1).toString();
        }
    }
} as GameModule;