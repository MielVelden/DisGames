import { GameTypeEnum } from '../../../src/interfaces/enums/database/GameTypeEnum';
import { GameFlowTestHelper } from '../../helpers/GameFlowTestHelper';
import { TestInputSimulator } from '../../builders/TestInputSimulator';
import { createGameFlowTestConfig } from '../../fixtures/games';
import { createTestUserAsync } from '../../fixtures/users';
import AssertionHelpers from '../../helpers/AssertionHelpers';
import { DEFAULT_WRONG_ANSWER_EMOJI } from '../../../src/utils/Emojis';
import TestRunner from '../../TestRunner';
import { TestSuite } from '../../interfaces/TestRunnerInterface';

export default function registerAnagramGameTests(runner: TestRunner): void {
    const suite: TestSuite = {
        name: 'AnagramGame Integration',
        description: 'Integration tests for complete Anagram game flows',

        setup: async () => {
            // Setup any test data if needed
        },

        teardown: async () => {
            // Cleanup any persistent test data
        },

        tests: [
            {
                name: 'should complete full anagram game flow successfully',
                testFunction: async () => {
                    // Arrange
                    const testUser = await createTestUserAsync();

                    const inputSimulator = TestInputSimulator.create()
                        .expectConfirmation(true, testUser.UserId!) // Confirm game start
                        .expectInput('cats', testUser.UserId!) // First answer
                        .expectInput('star', testUser.UserId!) // Second answer
                        .expectInput('listen', testUser.UserId!); // Final answer

                    const testGame = await createGameFlowTestConfig(GameTypeEnum.ANAGRAM, inputSimulator);
                    const helper = new GameFlowTestHelper();

                    // Act
                    const result = await helper.completeGameFlowAsync(testGame);

                    // Assert
                    AssertionHelpers.assertGameFlowSuccess(result, 'Game flow should complete successfully');
                    AssertionHelpers.assertNotNull(result.game, 'Game should exist after completion');
                    AssertionHelpers.assertNotNull(result.finalAnswer, 'Game should have a final answer');
                    AssertionHelpers.assertNoReactionExists(result.trackedReactions, DEFAULT_WRONG_ANSWER_EMOJI);
                    AssertionHelpers.assertAnyMessageWasDeleted(result.trackedMessages);
                }
            },

            {
                name: 'should handle incorrect anagram answers',
                testFunction: async () => {
                    // Arrange
                    const testUser = await createTestUserAsync();

                    const inputSimulator = TestInputSimulator.create()
                        .expectConfirmation(true, testUser.UserId!) // Confirm game start
                        .expectInput('wrong', testUser.UserId!) // Wrong answer
                        .expectInput('also_wrong', testUser.UserId!) // Another wrong answer
                        .expectInput('cats', testUser.UserId!); // Correct answer

                    const testGame = await createGameFlowTestConfig(GameTypeEnum.ANAGRAM, inputSimulator);
                    const helper = new GameFlowTestHelper();

                    // Act
                    const result = await helper.completeGameFlowAsync(testGame);

                    // Assert
                    AssertionHelpers.assertGameFlowSuccess(result, 'Game flow should handle wrong answers');
                    AssertionHelpers.assertNotNull(result.game, 'Game should exist');
                    AssertionHelpers.assertAnyMessageWasDeleted(result.trackedMessages);
                    AssertionHelpers.assertNoReactionExists(result.trackedReactions, DEFAULT_WRONG_ANSWER_EMOJI);
                }
            }
        ]
    };

    runner.addSuite(suite);
}