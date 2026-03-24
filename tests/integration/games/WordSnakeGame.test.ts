import { GameTypeEnum } from '../../../src/interfaces/enums/database/GameTypeEnum';
import { GameFlowTestHelper } from '../../helpers/GameFlowTestHelper';
import { TestInputSimulator } from '../../builders/TestInputSimulator';
import { createGameFlowTestConfig } from '../../fixtures/games';
import { createTestUserByNameAsync } from '../../fixtures/users';
import AssertionHelpers from '../../helpers/AssertionHelpers';
import { DEFAULT_ACCEPT_EMOJI } from '../../../src/utils/constants/Emojis';
import TestRunner from '../../TestRunner';
import { TestSuite } from '../../interfaces/TestRunnerInterface';
import { ExceptionEnum } from '../../../src/interfaces/enums';

export default function registerWordSnakeGameTests(runner: TestRunner): void {
    const suite: TestSuite = {
        name: 'WordSnakeGame Integration',
        description: 'Integration tests for complete WordSnake game flows',

        setup: async () => {
            // Setup any test data if needed
        },

        teardown: async () => {
            // Cleanup any persistent test data
        },

        tests: [
            {
                name: 'should complete full word snake game flow successfully',
                testFunction: async () => {
                    // Arrange
                    const userAlice = await createTestUserByNameAsync('Alice');
                    const userBob = await createTestUserByNameAsync('Bob');

                    const inputSimulator = TestInputSimulator.create()
                        .setGameFirstAnswer('c')
                        .addConfirmation({ value: true, userId: userAlice.UserId! }) // Confirm game start
                        .addInput({ value: 'cats', userId: userAlice.UserId! }) // First answer
                        .addInput({ value: 'stone', userId: userBob.UserId! }) // Second answer
                        .addInput({ value: 'eating', userId: userAlice.UserId! }); // Final answer

                    const testGame = await createGameFlowTestConfig(GameTypeEnum.WORD_SNAKE, inputSimulator, userAlice.UserId!);
                    const helper = new GameFlowTestHelper();

                    // Act
                    const result = await helper.completeGameFlowAsync(testGame);

                    // Assert
                    AssertionHelpers.assertGameFlowSuccess(result, 'Game flow should complete successfully');
                    AssertionHelpers.assertNotNull(result.game, 'Game should exist after completion');
                    AssertionHelpers.assertNotNull(result.finalAnswer, 'Game should have a final answer');
                    AssertionHelpers.assertReactionCount(result.trackedReactions, DEFAULT_ACCEPT_EMOJI, 3);
                    AssertionHelpers.assertNoMessageWasDeleted(result.trackedMessages, testGame.channelId);
                }
            },

            {
                name: 'should handle incorrect word snake answers',
                testFunction: async () => {
                    // Arrange
                    const userAlice = await createTestUserByNameAsync('Alice');
                    const userBob = await createTestUserByNameAsync('Bob');

                    const inputSimulator = TestInputSimulator.create()
                        .setGameFirstAnswer('c')
                        .addConfirmation({ value: true, userId: userAlice.UserId! }) // Confirm game start
                        .addInput({ value: 'cats', userId: userAlice.UserId! }) // Alice: First correct answer
                        .addWrongInput({ value: 'wrong', userId: userBob.UserId!, expectedException: ExceptionEnum.WRONG_ANSWER}) // Bob: First wrong answer
                        .addInput({ value: 'stone', userId: userAlice.UserId! }) // Alice: Second correct answer  
                        .addWrongInput({ value: 'eating', userId: userAlice.UserId!, expectedException: ExceptionEnum.SAME_USER_ALREADY_ANSWERED }); // Alice: Try again immediately (should fail)

                    const testGame = await createGameFlowTestConfig(GameTypeEnum.WORD_SNAKE, inputSimulator, userAlice.UserId!);
                    const helper = new GameFlowTestHelper();

                    // Act
                    const result = await helper.completeGameFlowAsync(testGame);

                    // Assert
                    AssertionHelpers.assertGameFlowSuccess(result, 'Game flow should handle wrong answers');
                    AssertionHelpers.assertNotNull(result.game, 'Game should exist');
                    AssertionHelpers.assertTrue(result.game?.Answer === 'e', 'Game should end with the correct answer');
                    AssertionHelpers.assertReactionCount(result.trackedReactions, DEFAULT_ACCEPT_EMOJI, 2);
                }
            }
        ]
    };

    runner.addSuite(suite);
}