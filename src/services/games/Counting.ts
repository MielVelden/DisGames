import { GameActionEnum, GameActionPriorityEnum, GameEvent, GameModule, GameOptionEnum } from "../../interfaces/domain/Game";
import { GameTypeEnum } from "../../interfaces/enums";
import { GameSettingsEnum } from "../../interfaces/enums";
import { i18n } from "../../utils/i18n/i18n";
import { MultiLingualString } from "../../utils/i18n/MultiLangualString";
import { GameSettingType } from "../../interfaces/domain/GameSettings";
import GameService from "../GameService";
import TimelineBuilder from "../TimelineBuilder";
import ComponentService from "../ComponentService";
import { DEFAULT_WRONG_ANSWER_EMOJI } from "../../utils/Emojis";

export default {
    config: {
        id: GameTypeEnum.COUNTING,
        emoji: "📊",
        name: new MultiLingualString(i18n.commands.games.types[GameTypeEnum.COUNTING].name),
        description: new MultiLingualString(i18n.commands.games.types[GameTypeEnum.COUNTING].description),
        points: 1,
        isCalculated: true,
        expectedType: "number",
        firstAnswer: "1",
        addCorrectReaction: true,
        options: {
            [GameOptionEnum.IS_INACTIVE]: false,
            [GameOptionEnum.DISABLE_MESSAGE_CHANGE]: true,
            [GameOptionEnum.SAME_USER_DISABLED]: true,
            [GameOptionEnum.REMOVE_ON_WRONG_ANSWER]: true,
            [GameOptionEnum.ALLOW_SKIPPING]: false,
        },
        settings: [
            {
                key: GameSettingsEnum.RESET_ON_FAIL,
                type: GameSettingType.BOOLEAN,
                label: new MultiLingualString(i18n.commands.games.settings.resetOnFail.label),
                description: new MultiLingualString(i18n.commands.games.settings.resetOnFail.description),
                defaultValue: false
            }
        ]
    },

    functions: {
        validateAnswer(event: GameEvent): boolean {
            return event.answer === Number(event.gameData.Answer);
        },

        async getNextAnswerAsync(event: GameEvent): Promise<void> {
            event.gameData.Answer = (Number(event.gameData.Answer) + 1).toString();
        },

        async onIncorrectAnswerAsync(event: GameEvent): Promise<void> {
            // Get the resetOnFail setting value from GameService
            const resetOnFail = GameService.getSettingValue<boolean>(event.gameData, GameSettingsEnum.RESET_ON_FAIL);
            
            if (resetOnFail) {
                // Reset the counter back to 0
                event.gameData.Answer = "0";

                event.addAction({
                    enum: GameActionEnum.REACTION,
                    priority: GameActionPriorityEnum.HIGH,
                    component: DEFAULT_WRONG_ANSWER_EMOJI
                });
                
                event.addAction({
                    enum: GameActionEnum.COMPONENT,
                    priority: GameActionPriorityEnum.HIGH,
                    component: ComponentService.createContent(new MultiLingualString(i18n.commands.games.labels.incorrectAnswer))
                });
            }
        }
    }
} as GameModule;