import { ButtonInteractionEvent, InteractionEvent, isButtonInteractionEvent, MessageInteractionEvent } from "../../interfaces/application/Event";
import { DatasheetsModel, GameDataModel, GamesModel, GamesSaveModel, PointsSaveModel } from "../../interfaces/database/TableInterfaces";
import { GameAction, GameActionEnum, GameActionPriorityEnum, GameConfig, GameModule, GameOptionEnum } from "../../interfaces/domain/Game";
import { GameEvent } from "../events/GameEvent";
import {
    GameSettingsSchema,
    GameSettingsValues,
    GameSettingType,
    BooleanGameSetting,
    EnumGameSetting,
    GameSettingsValidationResult
} from "../../interfaces/domain/GameSettings";
import { GameSettingsEnum } from "../../interfaces/enums/games/GameSettingsEnum";
import { Component, ComponentType, Container, TextDisplay, Title, Separator, ButtonStyle } from "../../interfaces/application/Message";
import GameRepository from "../../repositories/GameRepository";
import * as fs from "fs";
import * as path from "path";
import { GameTypeEnum, LanguageEnum, MetricEnum } from "../../interfaces/enums";
import PointService from "./PointService";
import { isValidEnumValue } from "../../utils/helpers/Enum";
import GameDataRepository from "../../repositories/GameDataRepository";
import { assertNever, ErrorHelper } from "../../utils/application/Error";
import ComponentService from "../application/ComponentService";
import { createCancelButton } from "../../builders/buttons/CancelButton";
import { createMoveButton as createMoveButtonAsync } from "../../builders/buttons/MoveButton";
import { ExceptionEnum } from "../../interfaces/enums/application/ExpectionEnum";
import { i18n } from "../../utils/i18n/i18n";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";
import MediaService from "../application/MediaService";
import Logger from "../../utils/application/Logger";
import TimelineBuilder from "./TimelineBuilder";
import { ARRAY_JOIN_DELIMITER } from "../../constants";
import { DEFAULT_ACCEPT_EMOJI } from "../../utils/constants/Emojis";
import ServerService from "./ServerService";
import { EventTypeEnum } from "../../interfaces/enums";
import DataSheetService from "./DataSheetService";
import { addPrefix, createFooter, createTitle } from "../../utils/helpers/Markdown";
import { InteractionService } from "../application/InteractionService";
import { RegisterMetricPulls, TrackMetricPull } from "../../utils/helpers/Decorator";

@RegisterMetricPulls()
class GameService {
    private games: GameModule[] = [];

    public async initAsync(): Promise<void> {
        await this.loadGamesAsync();
    }

    private async loadGamesAsync(): Promise<void> {
        const gamesPath = path.join(__dirname, '..', 'games');

        try {
            const gameFiles = fs.readdirSync(gamesPath).filter(file =>
                file.endsWith('.ts') || file.endsWith('.js')
            );

            for (const file of gameFiles) {
                try {
                    const gamePath = path.join(gamesPath, file);
                    const gameModule = require(gamePath).default as GameModule;

                    if (gameModule && gameModule.config && gameModule.functions) {
                        await this.completeGameConfigAsync(gameModule.config);
                        this.games.push(gameModule);
                    }
                } catch (error) {
                    Logger.logError(`Error loading game file ${file}:`, error as Error);
                }
            }
        } catch (error) {
            Logger.logError('Error loading games directory:', error as Error);
        }
    }

    private async completeGameConfigAsync(gameConfig: GameConfig): Promise<void> {
        if (!gameConfig.settings)
            gameConfig.settings = [];

        gameConfig.settings = gameConfig.settings.filter(s => !s.disabled);

        if (gameConfig.hasDataSheets) {
            try {
                const datasheets = await DataSheetService.getByGameIdAsync(gameConfig.id);
                if (datasheets.length > 0) {
                    gameConfig.settings.push({
                        key: GameSettingsEnum.DATASHEETS,
                        type: GameSettingType.LIST,
                        label: new MultiLingualString(i18n.commands.games.settings.datasheets.label),
                        description: new MultiLingualString(i18n.commands.games.settings.datasheets.description),
                        options: datasheets.map((datasheet: DatasheetsModel) => ({
                            value: datasheet.Id,
                            label: datasheet.Name,
                            description: datasheet.Description,
                        }))
                    });
                }
            } catch (error) {
                Logger.logError(`Failed to load datasheets for game ${gameConfig.id}, continuing without datasheet settings`, error as Error);
            }
        }
    }

    public getGames(): GameModule[] {
        return this.games;
    }

    public async checkActiveGameInChannel(channelId: string): Promise<boolean> {
         const externalIds = await GameRepository.getExternalIdsAsync();
         return externalIds.includes(channelId);
    }

    public async getActiveGamesAsync(serverId: string): Promise<GameModule[]> {
        const activeGames = await GameRepository.getByServerIdAsync(serverId);
        return this.games.filter(game => activeGames.some(activeGame => activeGame.GameTypeEnum === game.config.id));
    }

    public async getGameByTypeAsync(gameTypeEnum: GameTypeEnum): Promise<GameModule | undefined> {
        if(this.games.length === 0)
            await this.loadGamesAsync();
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

    public async getStartMessageAsync(game: GamesModel, gameData?: GameDataModel | GameDataModel[]): Promise<Component[]> {
        const gameModule = await this.getGameByTypeAsync(game.GameTypeEnum);
        if (!gameModule)
            ErrorHelper.throw(ExceptionEnum.GAME_MODULE_NOT_FOUND);

        let components = ComponentService.createStartMessage(game.GameTypeEnum as GameTypeEnum, gameModule.config.emoji, game.Answer as string);

        if (gameModule.functions.getStartComponentsAsync) {
            const server = await ServerService.getByExternalIdAsync(game.ServerId);
            const startComponents = await gameModule.functions.getStartComponentsAsync(Array.isArray(gameData) ? gameData : [gameData!], server);
            components.pop();
            components = components.concat(startComponents);
        }

        if (gameModule.config.options[GameOptionEnum.ALLOW_SKIPPING]) {
            components.push(
                ComponentService.createSeparator(),
                ComponentService.createContent(createFooter(new MultiLingualString(i18n.commands.games.labels.skipAnswer)))
            );
        }

        if (gameModule.config.hasImages && gameData) {
            // Loop through all gameData and get the image
            if (Array.isArray(gameData)) {
                for (const data of gameData) {
                    const image = MediaService.getGameDataImage(game.GameTypeEnum, data.Id);
                    components.push(ComponentService.createImage(image, false));
                }
            } else {
                const image = MediaService.getGameDataImage(game.GameTypeEnum, gameData.Id);
                components.push(ComponentService.createImage(image, false));
            }
        }

        return components;
    }

    public async saveAsync(savable: GamesSaveModel, event: InteractionEvent): Promise<GamesModel> {
        let gameData: GameDataModel | GameDataModel[] | undefined;

        // Check if the savable is valid
        if (savable.Id) {
            const model = await GameRepository.getByIdAsync(savable.Id);
            if (!model)
                ErrorHelper.throwSilently(ExceptionEnum.GAME_NOT_FOUND);

            const gameModule = await this.getGameByTypeAsync(model.GameTypeEnum as GameTypeEnum);
            if (!gameModule)
                ErrorHelper.throw(ExceptionEnum.GAME_MODULE_NOT_FOUND);

            if (!gameModule.config.isCalculated) {
                const gameDataArray = await GameDataRepository.getRandomDataByGameIdAsync(model.Id);
                gameData = gameDataArray;
                savable.Answer = gameData.map(data => data.Response.getMessage(event.server.LanguageEnum)).join(ARRAY_JOIN_DELIMITER);
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
            const startMessage = await this.getStartMessageAsync(savedModel, gameData);
            await event.sendToChannelAsync(savedModel.ChannelId, startMessage);

            await event.commitTimelineAsync();

            return model;
        }

        if (!savable.ChannelId || !savable.ServerId)
            ErrorHelper.throw(ExceptionEnum.CHANNEL_OR_SERVER_NOT_FOUND);

        if (savable.Answer)
            ErrorHelper.throw(ExceptionEnum.ANSWER_ALREADY_EXISTS);

        if (!isValidEnumValue(GameTypeEnum, savable.GameTypeEnum as GameTypeEnum))
            ErrorHelper.throw(ExceptionEnum.INVALID_GAME_TYPE);

        // Check if game exists in channel or server
        const [activeChannelGame, activeServerGame] = await Promise.all([
            GameRepository.getByChannelIdAsync(savable.ChannelId),
            GameRepository.getByServerAndGameIdAsync(savable.ServerId, savable.GameTypeEnum as GameTypeEnum)
        ]);

        const handleReplaceAsync = async (existingGame: GamesModel, event: ButtonInteractionEvent) => {
            await GameRepository.purgeAsync(existingGame.Id);
            await this.saveAsync(savable, event);
            await event.editAsync();
        };

        // Check if any game exists in the channel
        if (activeChannelGame) {
            ErrorHelper.throwWithComponents(
                ExceptionEnum.WANT_TO_REPLACE_CHANNEL,
                [createMoveButtonAsync(event.user.userId, async (event: InteractionEvent) => {
                    if (!isButtonInteractionEvent(event))
                        return;
                    await handleReplaceAsync(activeChannelGame, event);
                }),
                createCancelButton(event.user.userId)]
            );
        }

        // Check if the game exists in the server
        if (activeServerGame) {
            ErrorHelper.throwWithComponents(
                ExceptionEnum.WANT_TO_REPLACE_GAME,
                [createMoveButtonAsync(event.user.userId, async (event: InteractionEvent) => {
                    if (!isButtonInteractionEvent(event))
                        return;
                    await handleReplaceAsync(activeServerGame, event);
                }),
                createCancelButton(event.user.userId)]
            );
        }

        // Get the game module
        const gameModule = await this.getGameByTypeAsync(savable.GameTypeEnum as GameTypeEnum);
        if (!gameModule)
            ErrorHelper.throw(ExceptionEnum.GAME_MODULE_NOT_FOUND);

        // Set the answer
        if (gameModule.config.firstAnswer)
            savable.Answer = gameModule.config.firstAnswer;
        else
            savable.Answer = "temp";

        const model = await GameRepository.saveAsync(savable);

        if (!gameModule.config.firstAnswer) {
            gameData = await GameDataRepository.getRandomDataByGameIdAsync(model.Id!);

            if (gameModule.functions.prepareDataAsync)
                model.Answer = await gameModule.functions.prepareDataAsync(gameData, event.server.LanguageEnum);
            else
                model.Answer = gameData[0].Response.getMessage(event.server.LanguageEnum);

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
        const startMessage = await this.getStartMessageAsync(model, gameData);
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
                    component: DEFAULT_ACCEPT_EMOJI
                })

            // Answer is correct
            await this.handleValidAnswerAsync(gameEvent);
            // Add points to the user
            await PointService.saveAsync(new PointsSaveModel({
                UserId: gameEvent.user.userId,
                ServerId: gameEvent.server.ServerId,
                GameId: gameEvent.gameId,
                Points: gameEvent.gameConfig.points
            }), event);

            // Timeline for correct answer
            await TimelineBuilder.forGamePlayedAsync(gameEvent.gameId, {
                event: event,
                old: null,
                new: gameEvent.getGameData(),
                objectId: gameEvent.getGameData().Id
            });
        } else if (gameEvent.eventType === EventTypeEnum.MESSAGE) {
            // Answer is incorrect - handle via game module if available
            const gameModule = await this.getGameByTypeAsync(gameEvent.getGameData().GameTypeEnum);
            if (gameModule && gameModule.functions && gameModule.functions.onIncorrectAnswerAsync) {
                await gameModule.functions.onIncorrectAnswerAsync(gameEvent);
                await this.handleUpdateGameDataAsync(gameEvent);
            } else {
                // Delete the message
                await event.deleteAsync();
            }
        }

        if (gameEvent.eventType === EventTypeEnum.MESSAGE_DELETE)
            return;

        // Loop through all actions and handle them
        await this.handleGameActionsAsync(gameEvent, event);

        // Commit timeline
        await event.commitTimelineAsync();

        // Reply to the game channel
        await event.replyAsync();
    }

    private async handleUpdateGameDataAsync(gameEvent: GameEvent) {
        if (gameEvent.requireUpdateModel)
            await GameRepository.saveAsync(gameEvent.getGameData());
    }

    private async handleValidAnswerAsync(gameEvent: GameEvent) {
        if (gameEvent.gameConfig.hasImages) {
            const nextAnswer = await gameEvent.getNextAnswerAsync();
            // Don't support games with multiple images for now
            if (Array.isArray(nextAnswer) && nextAnswer.length > 0 && nextAnswer[0] && nextAnswer[0].Id) {
                const image = MediaService.getGameDataImage(gameEvent.gameId, nextAnswer[0].Id);
                gameEvent.addAction({
                    enum: GameActionEnum.COMPONENT,
                    priority: GameActionPriorityEnum.HIGH,
                    component: ComponentService.createImage(image, false)
                })
            }
        }

        if (!gameEvent.gameConfig.isCalculated) {
            gameEvent.addAction({
                enum: GameActionEnum.COMPONENT,
                priority: GameActionPriorityEnum.CRITICAL,
                component: [
                    ComponentService.createContent(createTitle(addPrefix(new MultiLingualString(i18n.commands.games.types[gameEvent.gameConfig.id].name), gameEvent.gameConfig.emoji))),
                    ComponentService.createContent(new MultiLingualString(i18n.commands.games.types[gameEvent.gameConfig.id].howToPlay)),
                    ComponentService.createContent(i18n.commands.games.types[gameEvent.gameConfig.id].nextAnswer!()),
                ]
            })
        }

        if (gameEvent.gameConfig.options[GameOptionEnum.ALLOW_SKIPPING]) {
            gameEvent.addAction({
                enum: GameActionEnum.COMPONENT,
                priority: GameActionPriorityEnum.LOW,
                component: [
                    ComponentService.createSeparator(),
                    ComponentService.createContent(createFooter(new MultiLingualString(i18n.commands.games.labels.skipAnswer)))
                ]
            })
        }

        if (gameEvent.getUpdatedGameAnswerAsync)
            await gameEvent.getUpdatedGameAnswerAsync(gameEvent);

        await this.handleUpdateGameDataAsync(gameEvent);
    }

    private async handleGameActionsAsync(gameEvent: GameEvent, event: MessageInteractionEvent) {
        for (const action of gameEvent.actions) {
            await this.handleGameAction(action, event);
            gameEvent.removeAction(action);
        }
    }

    private async handleGameOptionsAsync(gameEvent: GameEvent, event: MessageInteractionEvent): Promise<void> {
        const gameModule = await this.getGameByTypeAsync(gameEvent.getGameData().GameTypeEnum);
        const options = Object.entries(gameEvent.gameConfig.options)
            .filter(([_, value]) => value === true)
            .map(([key]) => Number(key))
            .sort((a, b) => a - b);

        for (const option of options) {
            switch (option as GameOptionEnum) {
                // Sort by run order
                case GameOptionEnum.IS_INACTIVE:
                    ErrorHelper.throw(ExceptionEnum.GAME_NOT_ACTIVE);
                case GameOptionEnum.DISABLE_MESSAGE_CHANGE:
                    if (gameEvent.getGameData().LastUser === gameEvent.user.userId && (gameEvent.eventType === EventTypeEnum.MESSAGE_UPDATE || gameEvent.eventType === EventTypeEnum.MESSAGE_DELETE)) {
                        const isInternalDeleteEvent = gameEvent.eventType === EventTypeEnum.MESSAGE_DELETE && InteractionService.isMessageInternallyDeleted(gameEvent.messageId);
                        if (gameEvent.eventType === EventTypeEnum.MESSAGE_UPDATE)
                            gameEvent.deleteMessage();

                        if (!isInternalDeleteEvent && gameEvent.getGameData().MessageId === gameEvent.messageId) {
                            gameEvent.addAction({
                                enum: GameActionEnum.COMPONENT,
                                priority: GameActionPriorityEnum.HIGH,
                                component: ComponentService.createContent(i18n.commands.games.event.messageChanged(gameEvent.user.username, gameEvent.userInput as string))
                            });

                            await this.handleGameActionsAsync(gameEvent, event);
                        }

                        ErrorHelper.throwSilently(ExceptionEnum.MESSAGE_CHANGE_DISABLED);
                    }
                    break;
                case GameOptionEnum.SAME_USER_DISABLED:
                    if (gameEvent.eventType !== EventTypeEnum.MESSAGE)
                        break;

                    if (gameEvent.getGameData().LastUser === gameEvent.user.userId) {
                        gameEvent.deleteMessage();
                        ErrorHelper.throwSilently(ExceptionEnum.SAME_USER_ALREADY_ANSWERED);
                    } else {
                        gameEvent.getGameData().LastUser = gameEvent.user.userId;
                        gameEvent.getGameData().MessageId = gameEvent.messageId;
                        gameEvent.requireUpdateModel = true;
                    }
                    break;
                case GameOptionEnum.REMOVE_ON_WRONG_ANSWER:
                    if (!gameEvent.validateAnswer(gameEvent) && !gameModule?.functions.onIncorrectAnswerAsync) {
                        gameEvent.deleteMessage();
                        ErrorHelper.throwSilently(ExceptionEnum.WRONG_ANSWER);
                    }
                    break;
                case GameOptionEnum.ALLOW_SKIPPING:
                    if (gameEvent.userInput === "?") {
                        await this.handleValidAnswerAsync(gameEvent);
                        await this.handleGameActionsAsync(gameEvent, event);
                        ErrorHelper.throwSilently(ExceptionEnum.ANSWER_SKIPPED);
                    }
                    break;
                default:
                    assertNever(option as never, GameOptionEnum)
            }
        }
    }

    private async handleGameAction(action: GameAction, event: MessageInteractionEvent): Promise<void> {
        switch (action.enum) {
            case GameActionEnum.REACTION:
                await event.reactAsync(action.component as string);
                break;
            case GameActionEnum.COMPONENT:
                if (Array.isArray(action.component)) {
                    for (const component of action.component) {
                        event.addComponentAsync(component);
                    }
                } else
                    event.addComponentAsync(action.component as Component);
                break;
            default:
                assertNever(action.enum, GameActionEnum)
        }
    }

    private async createGameEvent(event: MessageInteractionEvent): Promise<GameEvent> {
        const game = await this.getGameByChannelIdAsync(event.channelId);

        // If no game is found, return
        if (!game)
            ErrorHelper.throwSilently(ExceptionEnum.GAME_CHANNEL_NOT_FOUND);

        const gameModule = await this.getGameByTypeAsync(game.GameTypeEnum);
        if (!gameModule)
            ErrorHelper.throw(ExceptionEnum.GAME_MODULE_NOT_FOUND);

        const expectedType = gameModule.config.expectedType;

        var userInput: string | number | boolean;
        if (expectedType === "number") {
            userInput = Number(event.content);
            if (isNaN(userInput)) {
                await event.deleteAsync();
                ErrorHelper.throw(ExceptionEnum.INVALID_NUMBER);
            }
        } else if (expectedType === "boolean") {
            userInput = event.content.toLowerCase() === "true";
        } else {
            userInput = event.content.toLowerCase();
        }

        return new GameEvent({
            eventType: event.type,
            messageId: event.messageId,
            gameId: gameModule.config.id,
            gameConfig: gameModule.config,
            user: event.user,
            server: event.server,
            userInput: userInput,
            gameData: game,
            validateAnswer: gameModule.functions.validateAnswer,
            getNextAnswerAsync: gameModule.functions.getUpdatedGameAnswerAsync,
            onIncorrectAnswerAsync: gameModule.functions.onIncorrectAnswerAsync,
            deleteMessage: async () => {
                await event.deleteAsync();
            }
        });
    }

    // #region Game Settings Management
    public validateSettings(schema: GameSettingsSchema, values: GameSettingsValues): GameSettingsValidationResult {
        const errors: MultiLingualString[] = [];
        const validatedValues: GameSettingsValues = {};

        schema.forEach((setting) => {
            const value = values[setting.key];

            if (setting.required && (value === undefined || value === null)) {
                errors.push(new MultiLingualString(i18n.enums.exceptions[ExceptionEnum.SETTING_REQUIRED]));
                return;
            }

            if (value !== undefined && value !== null) {
                if (setting.type === GameSettingType.BOOLEAN) {
                    if (typeof value !== 'boolean') {
                        errors.push(new MultiLingualString(i18n.enums.exceptions[ExceptionEnum.SETTING_INVALID_TYPE]));
                        return;
                    }
                    validatedValues[setting.key] = value;
                } else if (setting.type === GameSettingType.ENUM) {
                    const enumSetting = setting as EnumGameSetting;
                    const validValues = enumSetting.options.map(opt => opt.value);
                    if (!validValues.includes(value as string | number)) {
                        errors.push(new MultiLingualString(i18n.enums.exceptions[ExceptionEnum.SETTING_INVALID_VALUE]));
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

    public async getSettingValueAsync<T = any>(game: GamesModel, settingKey: GameSettingsEnum): Promise<T | undefined> {
        const gameModule = await this.getGameByTypeAsync(game.GameTypeEnum);
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

        schema.filter(s => !s.disabled).forEach((setting) => {
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

    @TrackMetricPull(MetricEnum.ActiveGames)
    public async getTotalAsync(): Promise<number> {
        return await GameRepository.getTotalAsync();
    }
}

export default new GameService();