import { ComponentType } from "../../interfaces/application/Message";
import { GameActionEnum, GameActionPriorityEnum, GameEvent, GameModule, GameOptionEnum } from "../../interfaces/domain/Game";
import { GameTypeEnum } from "../../interfaces/enums";
import ComponentService from "../ComponentService";

export default {
    config: {
        id: GameTypeEnum.COUNTING,
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
            return event.answer === event.gameData.Answer;
        },

        processAnswer(event: GameEvent): void {
            event.addAction({
                enum: GameActionEnum.REACTION,
                priority: GameActionPriorityEnum.HIGH,
                component: "✅"
            })
        },

        getNextAnswer(event: GameEvent): void {
            event.gameData.Answer = (Number(event.gameData.Answer) + 1).toString();

            event.addAction({
                enum: GameActionEnum.COMPONENT,
                priority: GameActionPriorityEnum.HIGH,
                component: ComponentService.createContent("Next number is " + event.gameData.Answer)
            })
        }
    }
} as GameModule;