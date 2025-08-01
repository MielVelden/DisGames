import { EventTypeEnum, InteractionEvent, MessageInteractionEvent } from "../interfaces/application/Event";
import { GameDataModel, GamesModel, GamesSaveModel } from "../interfaces/database/TableInterfaces";
import { GameAction, GameActionEnum, GameActionPriorityEnum, GameEvent, GameModule, GameOptionEnum } from "../interfaces/domain/Game";
import {
    GameSettingsSchema,
    GameSettingsValues,
    GameSettingType,
    BooleanGameSetting,
    EnumGameSetting,
    GameSettingsValidationResult
} from "../interfaces/domain/GameSettings";
import { GameSettingsEnum } from "../interfaces/enums/games/GameSettingsEnum";
import { Component, ComponentType, Container, TextDisplay, Title, Separator, ButtonStyle } from "../interfaces/application/Message";
import GameRepository from "../repositories/GameRepository";
import * as fs from "fs";
import * as path from "path";
import { GameTypeEnum, LanguageEnum } from "../interfaces/enums";
import PointService from "./PointService";
import { isValidEnumValue } from "../utils/Enum";
import GameDataRepository from "../repositories/GameDataRepository";
import { ErrorHelper } from "../utils/ErrorHelper";
import ComponentService from "./ComponentService";
import { createCancelButton, createMoveButton } from "../utils/Button";
import { ExceptionEnum } from "../interfaces/enums/domain/ExpectionEnum";
import { i18n } from "../utils/i18n/i18n";
import { MultiLingualString } from "../utils/i18n/MultiLangualString";
import MediaService from "./MediaService";
import Logger from "../utils/Logger";
import TimelineBuilder from "./TimelineBuilder";
import UserRepository from "../repositories/UserRepository";
import ServerRepository from "../repositories/ServerRepository";
import { DEBUG_MODE } from "../config";

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

            // Track timeline for game update
            await TimelineBuilder.forGameUpdateAsync({
                old: model,
                new: savedModel,
                objectId: savedModel.Id,
                event
            });

            // Add start message
            const startMessage = await this.getStartMessageAsync(savedModel, event.server.LanguageEnum, gameData);
            await event.sendToChannelAsync(savedModel.ChannelId, startMessage);

            await event.commitTimelineAsync();

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

        // Track timeline for new game creation
        await TimelineBuilder.forGameUpdateAsync({
            old: null,
            new: model,
            objectId: model.Id,
            event
        });

        // Add start message
        const startMessage = await this.getStartMessageAsync(model, event.server.LanguageEnum, gameData);
        await event.addComponentsAsync(startMessage);

        await event.commitTimelineAsync();

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

            // Timeline for correct answer
            await TimelineBuilder.forGamePlayedAsync(gameEvent.gameId, {
                event: event,
                old: null,
                new: gameEvent.gameData,
                objectId: gameEvent.gameData.Id
            });
        } else if (gameEvent.eventType === EventTypeEnum.MESSAGE) {
            // Answer is incorrect - handle via game module if available
            const gameModule = this.getGameByType(gameEvent.gameData.GameTypeEnum);
            if (gameModule && gameModule.functions && gameModule.functions.onIncorrectAnswerAsync) {
                await gameModule.functions.onIncorrectAnswerAsync(gameEvent);
                await this.handleValidAnswerAsync(gameEvent);
            } else {
                // Delete the message
                await event.deleteAsync();
            }
        }

        // Loop through all actions and handle them
        await this.handleGameActionsAsync(gameEvent, event);

        // Commit timeline
        await event.commitTimelineAsync();

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

        if (gameEvent.getNextAnswerAsync)
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
        const gameModule = this.getGameByType(gameEvent.gameData.GameTypeEnum);
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
                    // Skip this option in debug mode
                    if (DEBUG_MODE)
                        break;

                    if (gameEvent.gameData.LastUser === gameEvent.user.id) {
                        gameEvent.deleteMessage();
                        throw ErrorHelper.throwError(ExceptionEnum.SAME_USER_ALREADY_ANSWERED);
                    } else {
                        gameEvent.gameData.LastUser = gameEvent.user.id;
                        gameEvent.gameData.MessageId = gameEvent.messageId;
                    }
                    break;
                case GameOptionEnum.REMOVE_ON_WRONG_ANSWER:
                    if (!gameEvent.validateAnswer(gameEvent) && !gameModule?.functions.onIncorrectAnswerAsync) {
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

    // #region Game Settings Management
    public validateSettings(schema: GameSettingsSchema, values: GameSettingsValues): GameSettingsValidationResult {
        const errors: MultiLingualString[] = [];
        const validatedValues: GameSettingsValues = {};

        schema.forEach((setting) => {
            const value = values[setting.key];

            if (setting.required && (value === undefined || value === null)) {
                errors.push(new MultiLingualString(i18n.exceptions[ExceptionEnum.SETTING_REQUIRED]));
                return;
            }

            if (value !== undefined && value !== null) {
                if (setting.type === GameSettingType.BOOLEAN) {
                    if (typeof value !== 'boolean') {
                        errors.push(new MultiLingualString(i18n.exceptions[ExceptionEnum.SETTING_INVALID_TYPE]));
                        return;
                    }
                    validatedValues[setting.key] = value;
                } else if (setting.type === GameSettingType.ENUM) {
                    const enumSetting = setting as EnumGameSetting;
                    const validValues = enumSetting.options.map(opt => opt.value);
                    if (!validValues.includes(value as string | number)) {
                        errors.push(new MultiLingualString(i18n.exceptions[ExceptionEnum.SETTING_INVALID_VALUE]));
                        return;
                    }
                    validatedValues[setting.key] = value;
                }
            } else {
                // Use default value
                validatedValues[setting.key] = setting.type === GameSettingType.BOOLEAN
                    ? (setting as BooleanGameSetting).defaultValue
                    : (setting as EnumGameSetting).defaultValue;
            }
        });

        return {
            isValid: errors.length === 0,
            errors,
            values: validatedValues
        };
    }

    public getDefaultSettings(schema: GameSettingsSchema): GameSettingsValues {
        const defaultValues: GameSettingsValues = {};

        schema.forEach((setting) => {
            if (setting.type === GameSettingType.BOOLEAN) {
                defaultValues[setting.key] = (setting as BooleanGameSetting).defaultValue;
            } else if (setting.type === GameSettingType.ENUM) {
                defaultValues[setting.key] = (setting as EnumGameSetting).defaultValue;
            }
        });

        return defaultValues;
    }

    public getSettingValue<T = any>(game: GamesModel, settingKey: GameSettingsEnum): T | undefined {
        const gameModule = this.getGameByType(game.GameTypeEnum);
        if (!gameModule?.config.settings) 
            return undefined;

        const setting = gameModule.config.settings.find(s => s.key === settingKey);
        if (!setting) 
            return undefined;

        if (game.Settings && game.Settings.hasOwnProperty(settingKey))
            return game.Settings[settingKey] as T;

        if (setting.type === GameSettingType.BOOLEAN)
            return (setting as BooleanGameSetting).defaultValue as T;
        else if (setting.type === GameSettingType.ENUM)
            return (setting as EnumGameSetting).defaultValue as T;

        return undefined;
    }

    public createSettingsDisplayComponents(
        schema: GameSettingsSchema,
        values: GameSettingsValues,
        languageEnum: LanguageEnum,
        isReadOnly: boolean = false
    ): Component[] {
        const components: Component[] = [];

        schema.forEach((setting) => {
            const currentValue = values[setting.key];

            // Title for setting
            components.push({
                type: ComponentType.TITLE,
                content: setting.label
            } as Title);

            // Description if available
            if (setting.description && !isReadOnly) {
                components.push({
                    type: ComponentType.TEXT_DISPLAY,
                    content: setting.description
                } as TextDisplay);
            }

            if (setting.type === GameSettingType.BOOLEAN) {
                const booleanValue = currentValue as boolean;

                if (isReadOnly) {
                    components.push({
                        type: ComponentType.TEXT_DISPLAY,
                        content: new MultiLingualString(booleanValue ? i18n.commands.games.settings.enabled : i18n.commands.games.settings.disabled)
                    } as TextDisplay);
                } else {
                    // Create toggle buttons for boolean
                    components.push(ComponentService.createButton({
                        style: booleanValue ? ButtonStyle.SUCCESS : ButtonStyle.SECONDARY,
                        label: new MultiLingualString(i18n.commands.games.settings.enabled),
                    }));

                    components.push(ComponentService.createButton({
                        style: !booleanValue ? ButtonStyle.DANGER : ButtonStyle.SECONDARY,
                        label: new MultiLingualString(i18n.commands.games.settings.disabled),
                    }));
                }
            } else if (setting.type === GameSettingType.ENUM) {
                const enumSetting = setting as EnumGameSetting;
                const currentEnumValue = currentValue;

                if (isReadOnly) {
                    const selectedOption = enumSetting.options.find(opt => opt.value === currentEnumValue);
                    components.push({
                        type: ComponentType.TEXT_DISPLAY,
                        content: selectedOption?.label || new MultiLingualString(i18n.commands.games.settings.unknown)
                    } as TextDisplay);
                } else {
                    // Create buttons for each enum option
                    enumSetting.options.forEach(option => {
                        const isSelected = option.value === currentEnumValue;
                        components.push(ComponentService.createButton({
                            style: isSelected ? ButtonStyle.SUCCESS : ButtonStyle.SECONDARY,
                            label: option.label,
                        }));
                    });
                }
            }

            // Add separator between settings
            components.push({
                type: ComponentType.SEPARATOR,
                divider: true,
                spacing: 1
            } as Separator);
        });

        // Remove last separator
        if (components.length > 0 && components[components.length - 1].type === ComponentType.SEPARATOR) {
            components.pop();
        }

        return components;
    }

    public createReadOnlySettingsContainer(
        schema: GameSettingsSchema,
        values: GameSettingsValues,
        languageEnum: LanguageEnum
    ): Container {
        const components = this.createSettingsDisplayComponents(schema, values, languageEnum, true);

        return {
            type: ComponentType.CONTAINER,
            components: [
                {
                    type: ComponentType.TITLE,
                    content: new MultiLingualString(i18n.commands.games.settings.currentSettings)
                },
                ...components
            ]
        } as Container;
    }
    // #endregion
}

export default new GameService();