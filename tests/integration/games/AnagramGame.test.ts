import { GameTypeEnum } from '../../../src/interfaces/enums/database/GameTypeEnum';
import { GameFlowTestHelper } from '../../helpers/GameFlowTestHelper';
import { TestInputSimulator } from '../../builders/TestInputSimulator';
import { createGameFlowTestConfig } from '../../fixtures/games';
import { createTestUserAsync } from '../../fixtures/users';
import AssertionHelpers from '../../helpers/AssertionHelpers';
import { DEFAULT_ACCEPT_EMOJI, DEFAULT_WRONG_ANSWER_EMOJI } from '../../../src/utils/constants/Emojis';
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
                    const userAlice = await createTestUserAsync();

                    const inputSimulator = TestInputSimulator.create()
                        .addConfirmation({ value: true, userId: userAlice.UserId! }) // Confirm game start
                        .addInput({ value: 'cats', userId: userAlice.UserId! }) // First answer
                        .addCorrectInput({ value: 'star', userId: userAlice.UserId! }) // Second answer
                        .addCorrectInput({ value: 'listen', userId: userAlice.UserId! }); // Final answer

                    const testGame = await createGameFlowTestConfig(GameTypeEnum.ANAGRAM, inputSimulator);
                    const helper = new GameFlowTestHelper();

                    // Act
                    const result = await helper.completeGameFlowAsync(testGame);

                    // Assert
                    AssertionHelpers.assertGameFlowSuccess(result, 'Game flow should complete successfully');
                    AssertionHelpers.assertNotNull(result.game, 'Game should exist after completion');
                    AssertionHelpers.assertNotNull(result.finalAnswer, 'Game should have a final answer');
                    AssertionHelpers.assertNoReactionExists(result.trackedReactions, DEFAULT_WRONG_ANSWER_EMOJI);
                    AssertionHelpers.assertNoMessageWasDeleted(result.trackedMessages, testGame.channelId);
                }
            },

            {
                name: 'should handle incorrect anagram answers',
                testFunction: async () => {
                    // Arrange
                    const userAlice = await createTestUserAsync();

                    const inputSimulator = TestInputSimulator.create()
                        .addConfirmation({ value: true, userId: userAlice.UserId! }) // Confirm game start
                        .addInput({ value: 'wrong', userId: userAlice.UserId! }) // First correct answer
                        .addInput({ value: 'also_wrong', userId: userAlice.UserId! }) // Wrong answer
                        .addInput({ value: 'also_superwrong', userId: userAlice.UserId! }); // Second wrong answer

                    const testGame = await createGameFlowTestConfig(GameTypeEnum.ANAGRAM, inputSimulator);
                    const helper = new GameFlowTestHelper();

                    // Act
                    const result = await helper.completeGameFlowAsync(testGame);

                    // Assert
                    AssertionHelpers.assertGameFlowSuccess(result, 'Game flow should handle wrong answers');
                    AssertionHelpers.assertNotNull(result.game, 'Game should exist');
                    AssertionHelpers.assertAnyMessageWasDeleted(result.trackedMessages);
                    AssertionHelpers.assertReactionCount(result.trackedReactions, DEFAULT_ACCEPT_EMOJI, 1);
                }
            }
        ]
    };

    runner.addSuite(suite);
}