import TestRunner, { TestSuite } from '../../TestRunner';
import { GameTypeEnum } from '../../../src/interfaces/enums/database/GameTypeEnum';
import { GameFlowTestHelper } from '../../helpers/GameFlowTestHelper';
import { TestInputSimulator } from '../../builders/TestInputSimulator';
import { createGameFlowTestConfig } from '../../fixtures/games';
import { createTestUserAsync } from '../../fixtures/users';
import AssertionHelpers from '../../helpers/AssertionHelpers';
import { DEFAULT_ACCEPT_EMOJI, DEFAULT_WRONG_ANSWER_EMOJI } from '../../../src/utils/Emojis';

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
                    // TODO:AssertionHelpers.assertReactionExists(result.trackedReactions, DEFAULT_WRONG_ANSWER_EMOJI);
                }
            },

            // {
            //     name: 'should handle anagram game with custom settings',
            //     testFunction: async () => {
            //         // Arrange
            //         const customSettings = {
            //             difficulty: 'hard',
            //             timeLimit: 120,
            //             hints: false
            //         };

            //         const helper = new GameFlowTestHelper();
            //         const gameConfig = {
            //             gameType: GameTypeEnum.ANAGRAM,
            //             channelId: TEST_CHANNEL_IDS.TEST_CHANNEL,
            //             serverId: TEST_SERVER_IDS.TEST_SERVER,
            //             userId: TEST_USER_IDS.ADMIN,
            //             settings: customSettings,
            //             expectedAnswers: []
            //         };

            //         // Act
            //         const result = await helper.startGameAsync(gameConfig);

            //         // Assert
            //         AssertionHelpers.assertGameFlowSuccess(result, 'Should create game with custom settings');
            //         AssertionHelpers.assertNotNull(result.game, 'Game should be created');

            //         if (result.game) {
            //             // Verify settings were applied
            //             const gameSettings = result.game.Settings as any;
            //             if (gameSettings) {
            //                 AssertionHelpers.assertEqual(gameSettings.difficulty, 'hard', 'Difficulty should be set to hard');
            //                 AssertionHelpers.assertEqual(gameSettings.timeLimit, 120, 'Time limit should be 120');
            //                 AssertionHelpers.assertEqual(gameSettings.hints, false, 'Hints should be disabled');
            //             }
            //         }
            //     }
            // },

            // {
            //     name: 'should prevent multiple anagram games in same channel',
            //     testFunction: async () => {
            //         // Arrange
            //         const helper1 = new GameFlowTestHelper();
            //         const helper2 = new GameFlowTestHelper();

            //         const gameConfig1 = {
            //             gameType: GameTypeEnum.ANAGRAM,
            //             channelId: TEST_CHANNEL_IDS.MAIN_CHANNEL,
            //             serverId: TEST_SERVER_IDS.MAIN_SERVER,
            //             userId: TEST_USER_IDS.PLAYER1,
            //             expectedAnswers: []
            //         };

            //         const gameConfig2 = {
            //             gameType: GameTypeEnum.ANAGRAM,
            //             channelId: TEST_CHANNEL_IDS.MAIN_CHANNEL, // Same channel
            //             serverId: TEST_SERVER_IDS.MAIN_SERVER,
            //             userId: TEST_USER_IDS.PLAYER2,
            //             expectedAnswers: []
            //         };

            //         // Act
            //         const result1 = await helper1.startGameAsync(gameConfig1);
            //         const result2 = await helper2.startGameAsync(gameConfig2);

            //         // Assert
            //         AssertionHelpers.assertGameFlowSuccess(result1, 'First game should be created successfully');

            //         // Second game should fail or require confirmation to replace
            //         // This behavior depends on your business logic
            //         if (result2.success) {
            //             // If replacement is allowed, verify the first game was cleaned up
            //             AssertionHelpers.assertNotNull(result2.game, 'Replacement game should exist');
            //         } else {
            //             // If replacement is not allowed, verify error handling
            //             AssertionHelpers.assertGreaterThan(result2.errors.length, 0, 'Should have errors preventing duplicate game');
            //         }
            //     }
            // },

            // {
            //     name: 'should track player progress in timeline',
            //     testFunction: async () => {
            //         // Arrange
            //         const helper = new GameFlowTestHelper();
            //         const gameConfig = {
            //             gameType: GameTypeEnum.ANAGRAM,
            //             channelId: TEST_CHANNEL_IDS.GAME_CHANNEL,
            //             serverId: TEST_SERVER_IDS.MAIN_SERVER,
            //             userId: TEST_USER_IDS.PLAYER1,
            //             expectedAnswers: ['cats', 'star']
            //         };

            //         // Act
            //         const result = await helper.playGameAsync(gameConfig, ['cats', 'star']);

            //         // Assert
            //         AssertionHelpers.assertGameFlowSuccess(result, 'Game should track progress');
            //         AssertionHelpers.assertGreaterThan(result.timeline.length, 0, 'Should have timeline entries');

            //         // Verify timeline contains game-related entries
            //         const hasGameEntries = result.timeline.some(entry => 
            //             entry.type && (
            //                 entry.type.includes('GAME') || 
            //                 entry.type.includes('ANSWER') ||
            //                 entry.type.includes('PROGRESS')
            //             )
            //         );

            //         // Note: This assertion might need adjustment based on actual timeline implementation
            //         // AssertionHelpers.assertEqual(hasGameEntries, true, 'Timeline should contain game-related entries');
            //     }
            // }
        ]
    };

    runner.addSuite(suite);
}