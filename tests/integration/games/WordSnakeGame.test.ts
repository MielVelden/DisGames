import { GameTypeEnum } from '../../../src/interfaces/enums/database/GameTypeEnum';
import { GameFlowTestHelper } from '../../helpers/GameFlowTestHelper';
import { TestInputSimulator } from '../../builders/TestInputSimulator';
import { createGameFlowTestConfig } from '../../fixtures/games';
import { createTestUserAsync } from '../../fixtures/users';
import AssertionHelpers from '../../helpers/AssertionHelpers';
import { DEFAULT_ACCEPT_EMOJI, DEFAULT_WRONG_ANSWER_EMOJI } from '../../../src/utils/Emojis';
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
                    const testUser = await createTestUserAsync();
                    const testUser2 = await createTestUserAsync();

                    const inputSimulator = TestInputSimulator.create()
                        .setGameFirstAnswer('c')
                        .addConfirmation({ value: true, userId: testUser.UserId! }) // Confirm game start
                        .addInput({ value: 'cats', userId: testUser.UserId! }) // First answer
                        .addInput({ value: 'stone', userId: testUser2.UserId! }) // Second answer
                        .addInput({ value: 'eating', userId: testUser.UserId! }); // Final answer

                    const testGame = await createGameFlowTestConfig(GameTypeEnum.WORD_SNAKE, inputSimulator);
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
                    const testUser = await createTestUserAsync();
                    const testUser2 = await createTestUserAsync();

                    const inputSimulator = TestInputSimulator.create()
                        .setGameFirstAnswer('c')
                        .addConfirmation({ value: true, userId: testUser.UserId! }) // Confirm game start
                        .addInput({ value: 'cats', userId: testUser.UserId! }) // First correct answer
                        .addWrongInput({ value: 'wrong', userId: testUser2.UserId!, expectedException: ExceptionEnum.WRONG_ANSWER }) // First wrong answer
                        .addWrongInput({ value: 'also_wrong', userId: testUser2.UserId!, expectedException: ExceptionEnum.WRONG_ANSWER }) // Second wrong answer
                        .addWrongInput({ value: 'also_superwrong', userId: testUser.UserId!, expectedException: ExceptionEnum.SAME_USER_ALREADY_ANSWERED }); // Double wrong answer

                    const testGame = await createGameFlowTestConfig(GameTypeEnum.WORD_SNAKE, inputSimulator);
                    const helper = new GameFlowTestHelper();

                    // Act
                    const result = await helper.completeGameFlowAsync(testGame);

                    // Assert
                    AssertionHelpers.assertGameFlowSuccess(result, 'Game flow should handle wrong answers');
                    AssertionHelpers.assertNotNull(result.game, 'Game should exist');
                    AssertionHelpers.assertTrue(result.game?.Answer === 's', 'Game should end with the correct answer');
                    AssertionHelpers.assertReactionCount(result.trackedReactions, DEFAULT_ACCEPT_EMOJI, 1);
                }
            }
        ]
    };

    runner.addSuite(suite);
}