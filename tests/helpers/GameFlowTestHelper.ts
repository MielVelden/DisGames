import { GameTypeEnum } from '../../src/interfaces/enums/database/GameTypeEnum';
import { InteractionEvent } from '../../src/interfaces/application/Event';
import { GamesModel, GamesSaveModel } from '../../src/interfaces/database/TableInterfaces';
import GameService from '../../src/services/GameService';
import GameRepository from '../../src/repositories/GameRepository';
import { TestDiscordEventBuilder, MockDiscordEvent } from '../builders/TestDiscordEventBuilder';
import { TestInputSimulator } from '../builders/TestInputSimulator';
import { DatabaseTestHelper } from './DatabaseTestHelper';
import Logger from '../../src/utils/Logger';

export interface GameFlowTestConfig {
    gameType: GameTypeEnum;
    channelId: string;
    serverId: string;
    userId: string;
    expectedAnswers?: string[];
    settings?: Record<string, any>;
    inputSimulator?: TestInputSimulator;
}

export interface GameFlowTestResult {
    success: boolean;
    game: GamesModel | null;
    messages: any[][];
    timeline: any[];
    errors: Error[];
    finalAnswer?: string;
    points?: number;
}

export class GameFlowTestHelper {
    private eventBuilder: TestDiscordEventBuilder;
    private results: GameFlowTestResult;

    constructor() {
        this.eventBuilder = TestDiscordEventBuilder.create();
        this.results = {
            success: false,
            game: null,
            messages: [],
            timeline: [],
            errors: []
        };
    }

    public async startGameAsync(config: GameFlowTestConfig): Promise<GameFlowTestResult> {
        try {
            Logger.logInfo(`[TEST] Starting game flow test for ${GameTypeEnum[config.gameType]}`);

            // Setup event builder with test data
            this.eventBuilder
                .withUser({ id: config.userId })
                .withServer({ id: config.serverId })
                .withChannel({ id: config.channelId });

            if (config.inputSimulator) {
                this.eventBuilder.withInputSimulator(config.inputSimulator);
            }

            // Create slash command event for starting the game
            const startEvent = this.eventBuilder.buildSlashCommandEvent('games', {
                game: GameTypeEnum[config.gameType].toLowerCase()
            });

            // Ensure the server exists before creating the game
            await DatabaseTestHelper.insertTestData('servers', [{
                ServerId: config.serverId,
                LanguageEnum: 2, // NL
                Points: 0
            }]);

            // Create game save model
            const gameSaveModel: GamesSaveModel = {
                ChannelId: config.channelId,
                ServerId: config.serverId,
                GameTypeEnum: config.gameType,
                SettingsJSON: config.settings || {}
            };

            // Save the game
            const savedGame = await GameService.saveAsync(gameSaveModel, startEvent);
            this.results.game = savedGame;

            // Collect sent messages
            this.results.messages = (startEvent as MockDiscordEvent).getSentMessages();
            this.results.timeline = startEvent.timelineEntries;

            Logger.logInfo(`[TEST] Game created with ID: ${savedGame.Id}`);
            this.results.success = true;

            return this.results;

        } catch (error) {
            Logger.logError('[TEST] Game flow test failed', error as Error);
            this.results.errors.push(error as Error);
            this.results.success = false;
            return this.results;
        }
    }

    public async playGameAsync(config: GameFlowTestConfig, playerAnswers: string[]): Promise<GameFlowTestResult> {
        try {
            // Start the game first
            const startResult = await this.startGameAsync(config);
            if (!startResult.success || !startResult.game) {
                return startResult;
            }

            Logger.logInfo(`[TEST] Playing game with ${playerAnswers.length} answers`);

            // Play through the game with provided answers
            for (let i = 0; i < playerAnswers.length; i++) {
                const answer = playerAnswers[i];
                
                // Create message event for player answer
                const answerEvent = this.eventBuilder.buildMessageEvent(answer);
                
                // Handle the game interaction
                await GameService.handleGameAsync(answerEvent);
                
                // Collect results
                const sentMessages = (answerEvent as MockDiscordEvent).getSentMessages();
                this.results.messages.push(...sentMessages);
                this.results.timeline.push(...answerEvent.timelineEntries);

                Logger.logInfo(`[TEST] Processed answer ${i + 1}: "${answer}"`);
            }

            // Get final game state
            const finalGame = await GameRepository.getByIDAsync(startResult.game.Id);
            if (finalGame) {
                this.results.game = finalGame;
                this.results.finalAnswer = finalGame.Answer;
            }

            return this.results;

        } catch (error) {
            Logger.logError('[TEST] Game play test failed', error as Error);
            this.results.errors.push(error as Error);
            this.results.success = false;
            return this.results;
        }
    }

    public async completeGameFlowAsync(config: GameFlowTestConfig): Promise<GameFlowTestResult> {
        try {
            // Start game
            const startResult = await this.startGameAsync(config);
            if (!startResult.success) {
                return startResult;
            }

            // Get the game module to understand expected answers
            const gameModule = GameService.getGameByType(config.gameType);
            if (!gameModule) {
                throw new Error(`Game module not found for type ${config.gameType}`);
            }

            // Use provided expected answers or generate them
            const expectedAnswers = config.expectedAnswers || this.generateTestAnswers(config.gameType);
            
            // Play through with expected answers
            const playResult = await this.playGameAsync(config, expectedAnswers);
            
            return playResult;

        } catch (error) {
            Logger.logError('[TEST] Complete game flow test failed', error as Error);
            this.results.errors.push(error as Error);
            this.results.success = false;
            return this.results;
        }
    }

    public async verifyGameStateAsync(gameId: number, expectedState: Partial<GamesModel>): Promise<boolean> {
        try {
            const game = await GameRepository.getByIDAsync(gameId);
            if (!game) {
                Logger.logError(`[TEST] Game ${gameId} not found`);
                return false;
            }

            // Verify each expected property
            for (const [key, expectedValue] of Object.entries(expectedState)) {
                const actualValue = (game as any)[key];
                if (actualValue !== expectedValue) {
                    Logger.logError(`[TEST] Game property ${key} mismatch. Expected: ${expectedValue}, Actual: ${actualValue}`);
                    return false;
                }
            }

            Logger.logInfo(`[TEST] Game state verification passed for game ${gameId}`);
            return true;

        } catch (error) {
            Logger.logError('[TEST] Game state verification failed', error as Error);
            return false;
        }
    }

    public async cleanupGameAsync(gameId: number): Promise<void> {
        try {
            await GameRepository.purgeAsync(gameId);
            Logger.logInfo(`[TEST] Cleaned up game ${gameId}`);
        } catch (error) {
            Logger.logInfo(`[TEST] Failed to cleanup game ${gameId}: ${(error as Error).message}`);
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
            game: null,
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
            expectedAnswers: options.expectedAnswers,
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