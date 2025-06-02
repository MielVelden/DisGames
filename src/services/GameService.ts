import { EventType, InteractionEvent, MessageInteractionEvent } from "../interfaces/application/Event";
import { GamesModel, GamesSaveModel } from "../interfaces/database/TableInterfaces";
import { GameAction, GameActionEnum, GameActionPriorityEnum, GameEvent, GameEventTypeEnum, GameModule, GameOptionEnum } from "../interfaces/domain/Game";
import GameRepository from "../repositories/GameRepository";
import * as fs from "fs";
import * as path from "path";
import { GameTypeEnum } from "../interfaces/enums";
import { Component } from "../interfaces/application/Message";
import PointService from "./PointService";
import { isValidEnumValue } from "../utils/Enum";
import GameDataRepository from "../repositories/GameDataRepository";
import { ErrorHelper } from "../utils/ErrorHelper";
import ComponentService from "./ComponentService";
import { User } from "../interfaces/domain/User";
import { createCancelButton, createMoveButton } from "../utils/Button";
import { ExceptionEnum } from "../interfaces/enums/domain/ExpectionEnum";
import { i18n } from "../utils/i18n/i18n";
import { MultiLingualString } from "../utils/i18n/MultiLangualString";

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
                    console.error(`Fout bij laden van game bestand ${file}:`, error);
                }
            }
        } catch (error) {
            console.error('Fout bij laden van games map:', error);
        }
    }

    public getGames(): GameModule[] {
        return this.games;
    }

    public getGameById(gameId: GameTypeEnum): GameModule | undefined {
        return this.games.find(game => game.config.id === gameId);
    }

    public async getGameByChannelIdAsync(channelId: string): Promise<GamesModel> {
        const game = await GameRepository.getByChannelIdAsync(channelId);
        return game;
    }

    public async saveAsync(savable: GamesSaveModel, user: User): Promise<GamesModel> {
        // Check if the savable is valid
        if (savable.Id)
            throw ErrorHelper.throwError(ExceptionEnum.GAME_ALREADY_EXISTS);

        if (!savable.ChannelId || !savable.ServerId)
            throw ErrorHelper.throwError(ExceptionEnum.CHANNEL_OR_SERVER_NOT_FOUND);

        if (savable.Answer)
            throw ErrorHelper.throwError(ExceptionEnum.ANSWER_ALREADY_EXISTS);

        if (!isValidEnumValue(GameTypeEnum, savable.GameTypeEnum as GameTypeEnum))
            throw ErrorHelper.throwError(ExceptionEnum.INVALID_GAME_TYPE);

        // Check if game exists in channel or server
        const [activeChannelGame, activeServerGame] = await Promise.all([
            GameRepository.getByChannelIdAsync(savable.ChannelId),
            GameRepository.getByServerIdAsync(savable.ServerId, savable.GameTypeEnum as GameTypeEnum)
        ]);

        const handleReplace = async (existingGame: GamesModel, event: InteractionEvent) => {
            await GameRepository.deleteAsync(existingGame.Id);
            await this.saveAsync(savable, user);
            await event.clearComponentsAsync();
            await event.addComponentAsync(ComponentService.createContent(new MultiLingualString(i18n.commands.games.setup.success)));
            await event.editAsync();
        };

        // Check if any game exists in the channel
        if (activeChannelGame) {
            throw ErrorHelper.throwErrorWithComponents(
                ExceptionEnum.WANT_TO_REPLACE_CHANNEL,
                [createMoveButton(user.id, (event) => handleReplace(activeChannelGame, event)),
                createCancelButton(user.id)]
            );
        }

        // Check if the game exists in the server
        if (activeServerGame) {
            throw ErrorHelper.throwErrorWithComponents(
                ExceptionEnum.WANT_TO_REPLACE_GAME,
                [createMoveButton(user.id, (event) => handleReplace(activeServerGame, event)),
                createCancelButton(user.id)]
            );
        }

        // Get the game module
        const gameModule = this.getGameById(savable.GameTypeEnum as GameTypeEnum);
        if (!gameModule)
            throw ErrorHelper.throwError(ExceptionEnum.GAME_MODULE_NOT_FOUND);

        // Set the answer
        if (gameModule.config.firstAnswer)
            savable.Answer = gameModule.config.firstAnswer;
        else {
            // Set the answer to a random game data
            const gameData = await GameDataRepository.getGameDataByGameIdAsync(savable.GameTypeEnum as GameTypeEnum);
            savable.Answer = gameData.Response;
        }

        // Save the game
        return await GameRepository.save(savable);
    }

    public async handleGameAsync(event: MessageInteractionEvent): Promise<void> {
        const gameEvent = await this.createGameEvent(event);

        await this.handleGameOptions(gameEvent, event);

        if (gameEvent.validateAnswer(gameEvent)) {
            // Answer is correct
            gameEvent.processAnswer(gameEvent);
            gameEvent.getNextAnswer(gameEvent);

            // Add points to the user
            await PointService.saveAsync(gameEvent.user.id, gameEvent.gameId, gameEvent.server.ServerId, gameEvent.gameConfig.points);

            // Save the model
            await GameRepository.save(gameEvent.gameData);
        }

        // Loop through all actions and handle them
        await this.handleGameActions(gameEvent, event);

        // Reply to the game channel
        await event.replyAsync();
    }

    private async handleGameActions(gameEvent: GameEvent, event: MessageInteractionEvent) {
        gameEvent.actions.forEach(async (action) => {
            await this.handleGameAction(action, event);
        });
    }

    private async handleGameOptions(gameEvent: GameEvent, event: MessageInteractionEvent): Promise<void> {
        const options = Object.entries(gameEvent.gameConfig.options)
            .filter(([_, value]) => value === true)
            .map(([key]) => Number(key))
            .sort((a, b) => a - b);

        options.forEach(option => {
            switch (option) {
                case GameOptionEnum.SAME_USER_DISABLED:
                    // Check if the user has already answered
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
                case GameOptionEnum.DISABLE_MESSAGE_CHANGE:
                    if (gameEvent.gameData.LastUser === gameEvent.user.id && gameEvent.eventType === GameEventTypeEnum.MESSAGE_UPDATE) {
                        gameEvent.deleteMessage();
                        gameEvent.addAction({
                            enum: GameActionEnum.COMPONENT,
                            priority: GameActionPriorityEnum.HIGH,
                            component: ComponentService.createContent(i18n.commands.games.event.messageChanged(gameEvent.user.username, gameEvent.answer as string))
                        });
                        this.handleGameActions(gameEvent, event);
                        event.sendAsync();
                        throw ErrorHelper.throwError(ExceptionEnum.MESSAGE_CHANGE_DISABLED);
                    }
                    break;
                case GameOptionEnum.IS_INACTIVE:
                    throw ErrorHelper.throwError(ExceptionEnum.GAME_NOT_ACTIVE);
                default:
                    throw new Error(`Unhandled game option: ${option}`);
            }
        });
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

        const gameModule = this.getGameById(game.GameTypeEnum);
        if (!gameModule)
            throw new Error(`Game module not found for game type ${game.GameTypeEnum}`);

        const expectedType = gameModule.config.expectedType;

        var answer: string | number | boolean;
        if (expectedType === "number") {
            answer = Number(event.content);
            if (isNaN(answer)) {
                throw new Error(`Invalid number: ${event.content}`);
            }
        } else if (expectedType === "boolean") {
            answer = event.content.toLowerCase() === "true";
        } else {
            answer = event.content;
        }

        const gameEvent: GameEvent = {
            eventType: event.type === EventType.MESSAGE ? GameEventTypeEnum.MESSAGE_CREATE : GameEventTypeEnum.MESSAGE_UPDATE,
            gameId: gameModule.config.id,
            gameConfig: gameModule.config,
            user: event.user,
            server: event.server,
            answer: answer,
            messageId: event.messageId,
            addAction: (action: GameAction) => {
                gameEvent.actions.push(action);
            },
            gameData: game,
            actions: [],
            validateAnswer: gameModule.functions.validateAnswer,
            processAnswer: gameModule.functions.processAnswer,
            getNextAnswer: gameModule.functions.getNextAnswer,
            deleteMessage: async () => {
                await event.deleteAsync();
            }
        } as GameEvent;

        return gameEvent;
    }

}

export default new GameService();