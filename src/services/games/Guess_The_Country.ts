import { GameActionEnum, GameActionPriorityEnum, GameFunctions, GameModule, GameOptionEnum } from "../../interfaces/domain/Game";
import { GameEvent } from "../events/GameEvent";
import { GameTypeEnum } from "../../interfaces/enums";
import { i18n } from "../../utils/i18n/i18n";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";
import ComponentService from "../application/ComponentService";
import { GameDataModel, ServersModel } from "../../interfaces/database/TableInterfaces";
import { Component } from "../../interfaces/application/Message";
import { compareStrings } from "../../utils/helpers/String";
import { getRejectEmoji } from "../../utils/constants/Emojis";
import { createBlock } from "../../utils/helpers/Markdown";

export default {
    config: {
        id: GameTypeEnum.GUESS_THE_COUNTRY,
        emoji: "🌍",
        name: new MultiLingualString(i18n.enums.gameTypes[GameTypeEnum.GUESS_THE_COUNTRY].name),
        description: new MultiLingualString(i18n.enums.gameTypes[GameTypeEnum.GUESS_THE_COUNTRY].description),
        points: 1,
        isCalculated: false,
        isPremiumOnly: true,
        expectedType: "string",
        addCorrectReaction: true,
        hasImages: true,
        skipDefaultStartMessage: true,
        allowDuplicatesResponse: true,
        options: {
            [GameOptionEnum.ALLOW_SKIPPING]: true,
        }
    },

    functions: {
        validateAnswer(event: GameEvent): boolean {
            return compareStrings(event.userInput as string, event.getGameDataAnswer());
        },

        async getUpdatedGameAnswerAsync(event: GameEvent): Promise<void> {
            const nextAnswer = await event.getNextAnswerAsync();
            const nextAnswerMessage = nextAnswer[0].Response.getMessage(event.server.LanguageEnum);
            event.setGameDataAnswer(nextAnswerMessage);
        },

        async getStartComponentsAsync(_gameData: GameDataModel[], _server: ServersModel): Promise<Component[]> {
            return [
                ComponentService.createContent(createBlock(i18n.enums.gameTypes[GameTypeEnum.GUESS_THE_COUNTRY].startMessage!()))
            ];
        },

        async onIncorrectAnswerAsync(event: GameEvent): Promise<void> {
            event.addAction({
                enum: GameActionEnum.REACTION,
                priority: GameActionPriorityEnum.HIGH,
                component: getRejectEmoji(event.server.Settings)
            })
        },
    } as GameFunctions
} as GameModule;
