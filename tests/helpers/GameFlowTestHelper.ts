import { GameTypeEnum } from '../../src/interfaces/enums/database/GameTypeEnum';
import { GamesModel, GamesSaveModel } from '../../src/interfaces/database/TableInterfaces';
import GameService from '../../src/services/domain/GameService';
import GameRepository from '../../src/repositories/GameRepository';
import { TestDiscordEventBuilder } from '../builders/TestDiscordEventBuilder';
import Logger from '../../src/utils/application/Logger';
import { CommandEnum } from '../../src/interfaces/enums/commands/CommandEnum';
import { GameFlowTestConfig, GameFlowTestResult } from '../interfaces/GameFlowInterface';
import { ComponentError } from '../../src/utils/application/Error';
import { createTestGameAsync } from '../fixtures/games';
import { TestInputSimulatorType } from '../interfaces/InputQueueInterface';
import AssertionHelpers from './AssertionHelpers';

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

    public async startGameAsync(config: GameFlowTestConfig, firstAnswer?: string): Promise<GameFlowTestResult> {
        try {
            Logger.logDebug(`Starting game flow test for ${GameTypeEnum[config.gameType]}`);
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
                Answer: config.inputSimulator.getGameFirstAnswer() || firstAnswer || ''
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
            // Get the first answer from the input simulator
            var input = config.inputSimulator.getNextInputResponse();
            var firstAnswer = input?.value as string;

            // Start the game first
            const startResult = await this.startGameAsync(config, firstAnswer);
            if (!startResult.success || !startResult.game)
                return startResult;

            var remainingAnswers = config.inputSimulator.getRemainingResponseCounts().inputResponses + 1;
            Logger.logDebug(`Playing game with ${remainingAnswers} answers`);

            // Play through the game with provided answers
            for (let i = 0; i < remainingAnswers; i++) {
                if (!input)
                    break;

                var answer = input?.value as string;
                const userId = input?.userId;

                if (input.type === TestInputSimulatorType.CORRECT_INPUT) {
                    var correctInput = await GameRepository.getByIDAsync(startResult.game.Id);
                    if (correctInput)
                        answer = correctInput.Answer;
                }

                // Create message event for player answer
                const answerEvent = this.eventBuilder.buildMessageEvent(answer, userId);

                if (input.type === TestInputSimulatorType.WRONG_INPUT) {
                    AssertionHelpers.assertThrowsAsync(async () => {
                        await GameService.handleGameAsync(answerEvent);
                    }, input.expectedException, `Expected wrong answer ${answer} to throw ${input.expectedException} exception`);
                } else {
                    // Handle the game interaction
                    await GameService.handleGameAsync(answerEvent);
                }

                // Collect results
                const sentMessages = answerEvent.getSentMessages();
                this.results.messages.push(...sentMessages);
                this.results.timeline.push(...answerEvent.timelineEntries);

                Logger.logDebug(`Processed answer ${i}: "${answer}"`);

                // Get the next answer from the input simulator
                input = config.inputSimulator.getNextInputResponse();
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

            Logger.logDebug(`Game state verification passed for game ${gameId}`);
            return true;

        } catch (error) {
            Logger.logError('Game state verification failed', error as Error);
            return false;
        }
    }

    public async cleanupGameAsync(gameId: number): Promise<void> {
        try {
            await GameRepository.purgeAsync(gameId);
            Logger.logDebug(`Cleaned up game ${gameId}`);
        } catch (error) {
            Logger.logDebug(`Failed to cleanup game ${gameId}: ${(error as Error).message}`);
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
}

export default GameFlowTestHelper;