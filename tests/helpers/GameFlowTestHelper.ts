import { GameTypeEnum } from '../../src/interfaces/enums/database/GameTypeEnum';
import { GamesModel, GamesSaveModel } from '../../src/interfaces/database/TableInterfaces';
import GameService from '../../src/services/GameService';
import GameRepository from '../../src/repositories/GameRepository';
import { TestDiscordEventBuilder, MockDiscordEvent } from '../builders/TestDiscordEventBuilder';
import Logger from '../../src/utils/Logger';
import { CommandEnum } from '../../src/interfaces/enums/commands/CommandEnum';
import { GameFlowTestConfig, GameFlowTestResult } from '../interfaces/GameFlowInterface';
import { ComponentError } from '../../src/utils/ErrorHelper';
import { ExceptionEnum } from '../../src/interfaces/enums';
import { createTestGameAsync } from '../fixtures/games';

export class GameFlowTestHelper {
    private eventBuilder: TestDiscordEventBuilder;
    private results: GameFlowTestResult;

    constructor() {
        this.eventBuilder = TestDiscordEventBuilder.create();
        this.results = {
            success: false,
            game: undefined,
            messages: [],
            timeline: [],
            errors: []
        };
    }

    public async startGameAsync(config: GameFlowTestConfig): Promise<GameFlowTestResult> {
        try {
            Logger.logInfo(`Starting game flow test for ${GameTypeEnum[config.gameType]}`);
            // Arrange
            // Setup event builder with test data
            this.eventBuilder
                .withUser({ id: config.userId })
                .withServer({ id: config.serverId })
                .withChannel({ id: config.channelId });

            if (config.inputSimulator)
                this.eventBuilder.withInputSimulator(config.inputSimulator);

            // Create slash command event for starting the game
            const startEvent = this.eventBuilder.buildSlashCommandEvent(CommandEnum.GAMES, {
                game: GameTypeEnum[config.gameType].toLowerCase()
            });

            // Create game save model
            const gameSaveModel: GamesSaveModel = {
                ChannelId: config.channelId,
                ServerId: config.serverId,
                GameTypeEnum: config.gameType,
                SettingsJSON: config.settings || {},
                Answer: config.expectedAnswers?.[0] || ''
            };
            const game = await createTestGameAsync(gameSaveModel);
            this.results.game = game;

            // Collect sent messages
            this.results.messages = startEvent.getSentMessages();
            this.results.timeline = startEvent.timelineEntries;

            this.results.success = true;

            return this.results;
        } catch (error) {
            Logger.logError('Game flow test failed', error as ComponentError);
            this.results.errors.push(error as ComponentError);
            this.results.success = false;
            return this.results;
        }
    }

    public async playGameAsync(config: GameFlowTestConfig): Promise<GameFlowTestResult> {
        try {
            // Start the game first
            const startResult = await this.startGameAsync(config);
            if (!startResult.success || !startResult.game)
                return startResult;

            Logger.logInfo(`Playing game with ${config.expectedAnswers?.length} answers`);

            // Play through the game with provided answers
            for (let i = 0; i < config.expectedAnswers?.length; i++) {
                const input = config.inputSimulator?.getNextInputResponse();
                const answer = input?.value as string;
                const userId = input?.userId;

                // Create message event for player answer
                const answerEvent = this.eventBuilder.buildMessageEvent(answer, userId);
                
                // Handle the game interaction
                await GameService.handleGameAsync(answerEvent);
                
                // Collect results
                const sentMessages = answerEvent.getSentMessages();
                this.results.messages.push(...sentMessages);
                this.results.timeline.push(...answerEvent.timelineEntries);

                Logger.logInfo(`Processed answer ${i + 1}: "${answer}"`);
            }

            // Get final game state
            const finalGame = await GameRepository.getByIDAsync(startResult.game.Id);
            if (finalGame) {
                this.results.game = finalGame;
                this.results.finalAnswer = finalGame.Answer;
            }

            this.results.trackedMessages = config.inputSimulator?.getTrackedMessages();
            this.results.trackedReactions = config.inputSimulator?.getTrackedReactions();

            return this.results;
        } catch (error) {
            Logger.logError('Game play test failed', error as ComponentError);
            this.results.errors.push(error as ComponentError);
            this.results.success = false;
            return this.results;
        }
    }

    public async completeGameFlowAsync(config: GameFlowTestConfig): Promise<GameFlowTestResult> {
        try {
            // Get the game module to understand expected answers
            const gameModule = GameService.getGameByType(config.gameType);
            if (!gameModule)
                throw new ComponentError({ message: ExceptionEnum.GAME_MODULE_NOT_FOUND });

            // Use provided expected answers or generate them
            if(!config.expectedAnswers)
                config.expectedAnswers = this.generateTestAnswers(config.gameType);
            
            // Play through with expected answers
            const playResult = await this.playGameAsync(config);
            
            return playResult;
        } catch (error) {
            Logger.logError('Complete game flow test failed', error as ComponentError);
            this.results.errors.push(error as ComponentError);
            this.results.success = false;
            return this.results;
        }
    }

    public async verifyGameStateAsync(gameId: number, expectedState: Partial<GamesModel>): Promise<boolean> {
        try {
            const game = await GameRepository.getByIDAsync(gameId);
            if (!game) {
                Logger.logError(`Game ${gameId} not found`);
                return false;
            }

            // Verify each expected property
            for (const [key, expectedValue] of Object.entries(expectedState)) {
                const actualValue = (game as any)[key];
                if (actualValue !== expectedValue) {
                    Logger.logError(`Game property ${key} mismatch. Expected: ${expectedValue}, Actual: ${actualValue}`);
                    return false;
                }
            }

            Logger.logInfo(`Game state verification passed for game ${gameId}`);
            return true;

        } catch (error) {
            Logger.logError('Game state verification failed', error as Error);
            return false;
        }
    }

    public async cleanupGameAsync(gameId: number): Promise<void> {
        try {
            await GameRepository.purgeAsync(gameId);
            Logger.logInfo(`Cleaned up game ${gameId}`);
        } catch (error) {
            Logger.logInfo(`Failed to cleanup game ${gameId}: ${(error as Error).message}`);
        }
    }

    private generateTestAnswers(gameType: GameTypeEnum): string[] {
        switch (gameType) {
            case GameTypeEnum.ANAGRAM:
                return ['test', 'word', 'game'];
            case GameTypeEnum.COUNTING:
                return ['1', '2', '3', '4', '5'];
            case GameTypeEnum.NUMBER_GUESS:
                return ['50', '75', '87', '92', '95'];
            case GameTypeEnum.GUESS_THE_FLAG:
                return ['netherlands', 'germany', 'france'];
            case GameTypeEnum.WORD_SNAKE:
                return ['apple', 'elephant', 'tree'];
            default:
                return ['test', 'answer'];
        }
    }

    public getResults(): GameFlowTestResult {
        return this.results;
    }

    public reset(): void {
        this.results = {
            success: false,
            game: undefined,
            messages: [],
            timeline: [],
            errors: []
        };
    }

    public static async createAndStartGame(
        gameType: GameTypeEnum, 
        options: Partial<GameFlowTestConfig> = {}
    ): Promise<GameFlowTestHelper> {
        const helper = new GameFlowTestHelper();
        const config: GameFlowTestConfig = {
            gameType,
            channelId: options.channelId || '123456789',
            serverId: options.serverId || '987654321',
            userId: options.userId || '555666777',
            expectedAnswers: options.expectedAnswers || [],
            settings: options.settings,
            inputSimulator: options.inputSimulator
        };

        await helper.startGameAsync(config);
        return helper;
    }

    public static async testCompleteGameFlow(
        gameType: GameTypeEnum,
        expectedAnswers: string[],
        options: Partial<GameFlowTestConfig> = {}
    ): Promise<GameFlowTestResult> {
        const helper = new GameFlowTestHelper();
        const config: GameFlowTestConfig = {
            gameType,
            channelId: options.channelId || '123456789',
            serverId: options.serverId || '987654321',
            userId: options.userId || '555666777',
            expectedAnswers,
            settings: options.settings,
            inputSimulator: options.inputSimulator
        };

        return await helper.completeGameFlowAsync(config);
    }
}

export default GameFlowTestHelper;