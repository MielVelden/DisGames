import { GameActionEnum, GameActionPriorityEnum, GameModule, GameOptionEnum } from "../../interfaces/domain/Game";
import { GameEvent } from "../events/GameEvent";
import { GameTypeEnum } from "../../interfaces/enums";
import { i18n } from "../../utils/i18n/i18n";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { DEFAULT_ACCEPT_EMOJI } from "../../utils/constants/Emojis";
import ComponentService from "../application/ComponentService";

const MAX_NUMBER = 1000;

function generateRandomNumber(): number {
    return Math.floor(Math.random() * MAX_NUMBER) + 1;
}

export default {
    config: {
        id: GameTypeEnum.NUMBER_GUESS,
        emoji: "🔢",
        name: new MultiLingualString(i18n.commands.games.types[GameTypeEnum.NUMBER_GUESS].name),
        description: new MultiLingualString(i18n.commands.games.types[GameTypeEnum.NUMBER_GUESS].description),
        points: 1,
        isCalculated: true,
        expectedType: "number",
        firstAnswer: "1",
        addCorrectReaction: false,
        options: {
            [GameOptionEnum.DISABLE_MESSAGE_CHANGE]: true,
            [GameOptionEnum.SAME_USER_DISABLED]: true,
            [GameOptionEnum.REMOVE_ON_WRONG_ANSWER]: true
        }
    },

    functions: {
        validateAnswer(event: GameEvent): boolean {
            const answer = Number(event.getGameDataAnswer());
            const userAnswer = Number(event.userInput);

            if (userAnswer === answer) {
                event.addAction({
                    enum: GameActionEnum.REACTION,
                    priority: GameActionPriorityEnum.HIGH,
                    component: DEFAULT_ACCEPT_EMOJI
                });
                return true;
            }

            return false;
        },

        async onIncorrectAnswerAsync(event: GameEvent): Promise<void> {
            const answer = Number(event.getGameDataAnswer());
            const userAnswer = Number(event.userInput);

            // If the user answer is lower than the answer, add higher icon
            if (userAnswer < answer) {
                event.addAction({
                    enum: GameActionEnum.REACTION,
                    priority: GameActionPriorityEnum.HIGH,
                    component: "🔼"
                });
            }

            // If the user answer is higher than the answer, add lower icon
            if (userAnswer > answer) {
                event.addAction({
                    enum: GameActionEnum.REACTION,
                    priority: GameActionPriorityEnum.HIGH,
                    component: "🔽"
                });
            }
        },

        async getUpdatedGameAnswerAsync(event: GameEvent): Promise<void> {
            const newAnswer = generateRandomNumber();
            event.setGameDataAnswer(newAnswer.toString());

            // Add the new answer to the event
            event.addAction({
                enum: GameActionEnum.COMPONENT,
                priority: GameActionPriorityEnum.HIGH,
                component: ComponentService.createContainer({
                    description: i18n.commands.games.types[GameTypeEnum.NUMBER_GUESS].nextAnswer!(MAX_NUMBER.toString())
                })
            });
        }
    }
} as GameModule;