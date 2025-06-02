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
        firstAnswer: "1",
        options: {
            [GameOptionEnum.DISABLE_MESSAGE_CHANGE]: true,
            [GameOptionEnum.SAME_USER_DISABLED]: true,
            [GameOptionEnum.REMOVE_ON_WRONG_ANSWER]: true
        }
    },

    functions: {
        validateAnswer(event: GameEvent): boolean {
            const answer = Number(event.gameData.Answer);
            const userAnswer = Number(event.answer);

            if(userAnswer === answer) {
                return true;
            }

            // If the user answer is lower than the answer, add higher icon
            if(userAnswer < answer)
                event.addAction({
                    enum: GameActionEnum.REACTION,
                    priority: GameActionPriorityEnum.HIGH,
                    component: "🔼"
                });

            // If the user answer is higher than the answer, add lower icon
            if(userAnswer > answer)
                event.addAction({
                    enum: GameActionEnum.REACTION,
                    priority: GameActionPriorityEnum.HIGH,
                    component: "🔽"
                });

            return false;
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