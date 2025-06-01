import { GameActionEnum, GameActionPriorityEnum, GameEvent, GameModule, GameOptionEnum } from "../../interfaces/domain/Game";
import { GameTypeEnum } from "../../interfaces/enums";
import ComponentService from "../ComponentService";
import { i18n } from "../../utils/i18n/i18n";

export default {
    config: {
        id: GameTypeEnum.COUNTING,
        name: "Counting",
        description: "Start counting with each other",
        points: 1,
        expectedType: "number",
        firstAnswer: "1",
        options: {
            [GameOptionEnum.IS_ACTIVE]: true,
            [GameOptionEnum.ALLOW_MESSAGE_CHANGE]: false,
            [GameOptionEnum.REACT]: true,
            [GameOptionEnum.SAME_USER_ALLOWED]: false,
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

        getNextAnswer(event: GameEvent): void {
            event.gameData.Answer = (Number(event.gameData.Answer) + 1).toString();
            
            event.addAction({
                enum: GameActionEnum.COMPONENT,
                priority: GameActionPriorityEnum.HIGH,
                component: ComponentService.createContent(i18n.commands.games.setup.nextNumber(event.gameData.Answer))
            })
        }
    }
} as GameModule;