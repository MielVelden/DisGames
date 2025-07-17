import { EventTypeEnum, InteractionEvent, MessageInteractionEvent } from "../interfaces/application/Event";
import { GameDataModel, GamesModel, GamesSaveModel } from "../interfaces/database/TableInterfaces";
import { GameAction, GameActionEnum, GameActionPriorityEnum, GameEvent, GameModule, GameOptionEnum } from "../interfaces/domain/Game";
import GameRepository from "../repositories/GameRepository";
import * as fs from "fs";
import * as path from "path";
import { GameTypeEnum, LanguageEnum } from "../interfaces/enums";
import { Component } from "../interfaces/application/Message";
import PointService from "./PointService";
import { isValidEnumValue } from "../utils/Enum";
import GameDataRepository from "../repositories/GameDataRepository";
import { ErrorHelper } from "../utils/ErrorHelper";
import ComponentService from "./ComponentService";
import { createCancelButton, createMoveButton } from "../utils/Button";
import { ExceptionEnum } from "../interfaces/enums/domain/ExpectionEnum";
import { i18n } from "../utils/i18n/i18n";
import MediaService from "./MediaService";
import Logger from "../utils/Logger";

class GameService {
    private games: GameModule[] = [];

    constructor() {
        this.loadGames();
    }

    private loadGames(): void {
        const gamesPath = path.join(__dirname, 'games');

        try {
            const gameFiles = fs.readdirSync(gamesPath).filter(file =>
                file.endsWith('.ts') || file.endsWith('.js')
            );

            for (const file of gameFiles) {
                try {
                    const gamePath = path.join(gamesPath, file);
                    const gameModule = require(gamePath).default as GameModule;

                    if (gameModule && gameModule.config && gameModule.functions) {
                        this.games.push(gameModule);
                    }
                } catch (error) {
                    Logger.logError(`Fout bij laden van game bestand ${file}:`, error as Error);
                }
            }
        } catch (error) {
            Logger.logError('Fout bij laden van games map:', error as Error);
        }
    }

    public getGames(): GameModule[] {
        return this.games;
    }

    public async getActiveGamesAsync(serverId: string): Promise<GameModule[]> {
        const activeGames = await GameRepository.getByServerIdAsync(serverId);
        return this.games.filter(game => activeGames.some(activeGame => activeGame.GameTypeEnum === game.config.id));
    }

    public getGameByType(gameTypeEnum: GameTypeEnum): GameModule | undefined {
        return this.games.find(game => game.config.id === gameTypeEnum);
    }

    public async getGameByChannelIdAsync(channelId: string): Promise<GamesModel> {
        const game = await GameRepository.getByChannelIdAsync(channelId);
        return game;
    }

    public async getGameByServerIdAndGameIdAsync(serverId: string, gameId: GameTypeEnum): Promise<GamesModel> {
        const game = await GameRepository.getByServerAndGameIdAsync(serverId, gameId);
        return game;
    }

    public async getStartMessageAsync(game: GamesModel, languageEnum: LanguageEnum, gameData?: GameDataModel): Promise<Component[]> {
        const gameModule = this.getGameByType(game.GameTypeEnum);
        if (!gameModule)
            throw ErrorHelper.throwError(ExceptionEnum.GAME_MODULE_NOT_FOUND);

        let components = ComponentService.createStartMessageAsync(game.GameTypeEnum as GameTypeEnum, game.Answer as string);

        if (gameModule.functions.getStartComponents) {
            const startComponents = gameModule.functions.getStartComponents(gameData!, languageEnum);
            components[components.length - 1] = startComponents[startComponents.length - 1];
        }

        if (gameModule.config.hasImages && gameData) {
            const image = MediaService.getGameDataImage(game.GameTypeEnum, gameData.Id);
            components.push(ComponentService.createImage(image));
        }

        return components;
    }

    public async saveAsync(savable: GamesSaveModel, event: InteractionEvent): Promise<GamesModel> {
        let gameData: GameDataModel | undefined;

        // Check if the savable is valid
        if (savable.Id) {
            const model = await GameRepository.getByIDAsync(savable.Id);
            if (!model)
                throw ErrorHelper.throwError(ExceptionEnum.GAME_NOT_FOUND);

            const gameModule = this.getGameByType(model.GameTypeEnum as GameTypeEnum);
            if (!gameModule)
                throw ErrorHelper.throwError(ExceptionEnum.GAME_MODULE_NOT_FOUND);

            if (!gameModule.config.isCalculated) {
                gameData = await GameDataRepository.getGameDataByGamesIdAsync(model.Id);
                savable.Answer = gameData.Response.getMessage(event.server.LanguageEnum);
            }

            // Update
            const savedModel = await GameRepository.saveAsync(savable);

            // Add start message
            const startMessage = await this.getStartMessageAsync(savedModel, event.server.LanguageEnum, gameData);
            await event.sendToChannelAsync(savedModel.ChannelId, startMessage);

            return model;
        }

        if (!savable.ChannelId || !savable.ServerId)
            throw ErrorHelper.throwError(ExceptionEnum.CHANNEL_OR_SERVER_NOT_FOUND);

        if (savable.Answer)
            throw ErrorHelper.throwError(ExceptionEnum.ANSWER_ALREADY_EXISTS);

        if (!isValidEnumValue(GameTypeEnum, savable.GameTypeEnum as GameTypeEnum))
            throw ErrorHelper.throwError(ExceptionEnum.INVALID_GAME_TYPE);

        // Check if game exists in channel or server
        const [activeChannelGame, activeServerGame] = await Promise.all([
            GameRepository.getByChannelIdAsync(savable.ChannelId),
            GameRepository.getByServerAndGameIdAsync(savable.ServerId, savable.GameTypeEnum as GameTypeEnum)
        ]);

        const handleReplace = async (existingGame: GamesModel, event: MessageInteractionEvent) => {
            await GameRepository.purgeAsync(existingGame.Id);
            await this.saveAsync(savable, event);
            await event.editAsync();
        };

        // Check if any game exists in the channel
        if (activeChannelGame) {
            throw ErrorHelper.throwErrorWithComponents(
                ExceptionEnum.WANT_TO_REPLACE_CHANNEL,
                [createMoveButton(event.user.id, (event: InteractionEvent) => handleReplace(activeChannelGame, event as MessageInteractionEvent)),
                createCancelButton(event.user.id)]
            );
        }

        // Check if the game exists in the server
        if (activeServerGame) {
            throw ErrorHelper.throwErrorWithComponents(
                ExceptionEnum.WANT_TO_REPLACE_GAME,
                [createMoveButton(event.user.id, (event: InteractionEvent) => handleReplace(activeServerGame, event as MessageInteractionEvent)),
                createCancelButton(event.user.id)]
            );
        }

        // Get the game module
        const gameModule = this.getGameByType(savable.GameTypeEnum as GameTypeEnum);
        if (!gameModule)
            throw ErrorHelper.throwError(ExceptionEnum.GAME_MODULE_NOT_FOUND);

        // Set the answer
        if (gameModule.config.firstAnswer)
            savable.Answer = gameModule.config.firstAnswer;
        else
            savable.Answer = "temp";

        const model = await GameRepository.saveAsync(savable);

        if (!gameModule.config.firstAnswer) {
            gameData = await GameDataRepository.getGameDataByGamesIdAsync(model.Id!);
            model.Answer = gameData.Response.getMessage(event.server.LanguageEnum);
            await GameRepository.saveAsync(model);
        }

        // Add start message
        const startMessage = await this.getStartMessageAsync(model, event.server.LanguageEnum, gameData);
        await event.addComponentsAsync(startMessage);

        // Save the game
        return model;
    }

    public async deleteAsync(id: number): Promise<void> {
        await GameRepository.purgeAsync(id);
    }

    // #region Handle Game
    public async handleGameAsync(event: MessageInteractionEvent): Promise<void> {
        const gameEvent = await this.createGameEvent(event);

        await this.handleGameOptionsAsync(gameEvent, event);

        if (gameEvent.validateAnswer(gameEvent) && gameEvent.eventType === EventTypeEnum.MESSAGE) {
            // Add correct reaction
            if (gameEvent.gameConfig.addCorrectReaction)
                gameEvent.addAction({
                    enum: GameActionEnum.REACTION,
                    priority: GameActionPriorityEnum.HIGH,
                    component: "✅"
                })

            // Answer is correct
            await this.handleValidAnswerAsync(gameEvent);
            // Add points to the user
            await PointService.saveAsync(gameEvent.user.id, gameEvent.gameId, gameEvent.server.ServerId, gameEvent.gameConfig.points);
        }

        // Loop through all actions and handle them
        await this.handleGameActionsAsync(gameEvent, event);

        // Reply to the game channel
        await event.replyAsync();
    }

    private async handleValidAnswerAsync(gameEvent: GameEvent) {
        // Get the next answer
        if (!gameEvent.gameConfig.isCalculated)
            gameEvent.nextAnswer = await GameDataRepository.getGameDataByGamesIdAsync(gameEvent.gameData.Id);

        if (gameEvent.gameConfig.hasImages) {
            const image = MediaService.getGameDataImage(gameEvent.gameId, gameEvent.nextAnswer!.Id);
            gameEvent.addAction({
                enum: GameActionEnum.COMPONENT,
                priority: GameActionPriorityEnum.HIGH,
                component: ComponentService.createImage(image)
            })
        }

        await gameEvent.getNextAnswerAsync(gameEvent);

        // Save the model
        await GameRepository.saveAsync(gameEvent.gameData);
    }

    private async handleGameActionsAsync(gameEvent: GameEvent, event: MessageInteractionEvent) {
        for (const action of gameEvent.actions) {
            await this.handleGameAction(action, event);
            gameEvent.removeAction(action);
        }
    }

    private async handleGameOptionsAsync(gameEvent: GameEvent, event: MessageInteractionEvent): Promise<void> {
        const options = Object.entries(gameEvent.gameConfig.options)
            .filter(([_, value]) => value === true)
            .map(([key]) => Number(key))
            .sort((a, b) => a - b);

        for (const option of options) {
            switch (option as GameOptionEnum) {
                // Sort by run order
                case GameOptionEnum.IS_INACTIVE:
                    throw ErrorHelper.throwError(ExceptionEnum.GAME_NOT_ACTIVE);
                case GameOptionEnum.DISABLE_MESSAGE_CHANGE:
                    if (gameEvent.gameData.LastUser === gameEvent.user.id && (gameEvent.eventType === EventTypeEnum.MESSAGE_UPDATE || gameEvent.eventType === EventTypeEnum.MESSAGE_DELETE)) {
                        if (gameEvent.eventType === EventTypeEnum.MESSAGE_UPDATE)
                            gameEvent.deleteMessage();

                        gameEvent.addAction({
                            enum: GameActionEnum.COMPONENT,
                            priority: GameActionPriorityEnum.HIGH,
                            component: ComponentService.createContent(i18n.commands.games.event.messageChanged(gameEvent.user.username, gameEvent.answer as string))
                        });
                        await this.handleGameActionsAsync(gameEvent, event);
                        await event.sendAsync();
                        throw ErrorHelper.throwError(ExceptionEnum.MESSAGE_CHANGE_DISABLED);
                    }
                    break;
                case GameOptionEnum.SAME_USER_DISABLED:
                    if (gameEvent.gameData.LastUser === gameEvent.user.id) {
                        gameEvent.deleteMessage();
                        throw ErrorHelper.throwError(ExceptionEnum.SAME_USER_ALREADY_ANSWERED);
                    } else {
                        gameEvent.gameData.LastUser = gameEvent.user.id;
                        gameEvent.gameData.MessageId = gameEvent.messageId;
                    }
                    break;
                case GameOptionEnum.REMOVE_ON_WRONG_ANSWER:
                    if (!gameEvent.validateAnswer(gameEvent)) {
                        gameEvent.deleteMessage();
                        throw ErrorHelper.throwError(ExceptionEnum.WRONG_ANSWER);
                    }
                    break;
                case GameOptionEnum.ALLOW_SKIPPING:
                    if (gameEvent.answer === "?") {
                        await this.handleValidAnswerAsync(gameEvent);
                        await this.handleGameActionsAsync(gameEvent, event);
                    }
                    break;
                default:
                    // Cast to unknown first, then never to handle the exhaustive check properly
                    const exhaustiveCheck: never = (option as unknown) as never;
                    throw new Error(`Unhandled game option: ${exhaustiveCheck}`);
            }
        }
    }

    private async handleGameAction(action: GameAction, event: MessageInteractionEvent): Promise<void> {
        switch (action.enum) {
            case GameActionEnum.REACTION:
                await event.reactAsync(action.component as string);
                break;
            case GameActionEnum.COMPONENT:
                event.addComponentAsync(action.component as Component);
                break;
            default:
                const exhaustiveCheck: never = action.enum;
                throw new Error(`Unhandled game action type: ${exhaustiveCheck}`);
        }
    }

    private async createGameEvent(event: MessageInteractionEvent): Promise<GameEvent> {
        const game = await this.getGameByChannelIdAsync(event.channelId);

        // If no game is found, return
        if (!game)
            throw new Error(`Game not found for channel ${event.channelId}`);

        const gameModule = this.getGameByType(game.GameTypeEnum);
        if (!gameModule)
            throw new Error(`Game module not found for game type ${game.GameTypeEnum}`);

        const expectedType = gameModule.config.expectedType;

        var answer: string | number | boolean;
        if (expectedType === "number") {
            answer = Number(event.content);
            if (isNaN(answer)) {
                await event.deleteAsync();
                throw ErrorHelper.throwError(ExceptionEnum.INVALID_NUMBER);
            }
        } else if (expectedType === "boolean") {
            answer = event.content.toLowerCase() === "true";
        } else {
            answer = event.content.toLowerCase();
        }

        const gameEvent: GameEvent = {
            eventType: event.type,
            gameId: gameModule.config.id,
            gameConfig: gameModule.config,
            user: event.user,
            server: event.server,
            answer: answer,
            messageId: event.messageId,
            addAction: (action: GameAction) => {
                gameEvent.actions.push(action);
            },
            removeAction: (action: GameAction) => {
                gameEvent.actions = gameEvent.actions.filter(a => a.enum !== action.enum);
            },
            gameData: game,
            actions: [],
            validateAnswer: gameModule.functions.validateAnswer,
            addCorrectReaction: gameModule.config.addCorrectReaction,
            getNextAnswerAsync: gameModule.functions.getNextAnswerAsync,
            deleteMessage: async () => {
                await event.deleteAsync();
            }
        } as GameEvent;

        return gameEvent;
    }
    // #endregion
}

export default new GameService();