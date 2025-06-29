import { GameActionEnum, GameActionPriorityEnum, GameEvent, GameModule, GameOptionEnum } from "../../interfaces/domain/Game";
import { GameTypeEnum } from "../../interfaces/enums";
import { i18n } from "../../utils/i18n/i18n";
import { MultiLingualString } from "../../utils/i18n/MultiLangualString";

const MAX_NUMBER = 100;

export default {
    config: {
        id: GameTypeEnum.NUMBER_GUESS,
        emoji: "🔢",
        name: new MultiLingualString(i18n.commands.games.types[GameTypeEnum.NUMBER_GUESS].name),
        description: new MultiLingualString(i18n.commands.games.types[GameTypeEnum.NUMBER_GUESS].description),
        points: 1,
        expectedType: "number",
        firstAnswer: "1",
        addCorrectReaction: true,
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

        getNextAnswerAsync(event: GameEvent): void {
            event.gameData.Answer = (Math.floor(Math.random() * MAX_NUMBER) + 1).toString();
        }
    }
} as GameModule;