import { GameTypeEnum } from '../../../src/interfaces/enums/database/GameTypeEnum';
import { GameFlowTestHelper } from '../../helpers/GameFlowTestHelper';
import { TestInputSimulator } from '../../builders/TestInputSimulator';
import { createGameFlowTestConfig, createTestGameAsync } from '../../fixtures/games';
import { createTestUserAsync } from '../../fixtures/users';
import { createTestServerAsync } from '../../fixtures/servers';
import { createTestChannelAsync } from '../../fixtures/channels';
import AssertionHelpers from '../../helpers/AssertionHelpers';
import { DEFAULT_ACCEPT_EMOJI, DEFAULT_WRONG_ANSWER_EMOJI } from '../../../src/utils/constants/Emojis';
import TestRunner from '../../TestRunner';
import { TestSuite } from '../../interfaces/TestRunnerInterface';
import { TestDiscordEventBuilder } from '../../builders/TestDiscordEventBuilder';
import { GamesSaveModel } from '../../../src/interfaces/database/TableInterfaces';
import GameService from '../../../src/services/domain/GameService';

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

                    const testGame = await createGameFlowTestConfig(GameTypeEnum.ANAGRAM, inputSimulator, userAlice.UserId!);
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

                    const testGame = await createGameFlowTestConfig(GameTypeEnum.ANAGRAM, inputSimulator, userAlice.UserId!);
                    const helper = new GameFlowTestHelper();

                    // Act
                    const result = await helper.completeGameFlowAsync(testGame);

                    // Assert
                    AssertionHelpers.assertGameFlowSuccess(result, 'Game flow should handle wrong answers');
                    AssertionHelpers.assertNotNull(result.game, 'Game should exist');
                    AssertionHelpers.assertNoMessageWasDeleted(result.trackedMessages, testGame.channelId);
                    AssertionHelpers.assertReactionCount(result.trackedReactions, DEFAULT_ACCEPT_EMOJI, 1);
                    AssertionHelpers.assertReactionCount(result.trackedReactions, DEFAULT_WRONG_ANSWER_EMOJI, 2);
                }
            },

            {
                name: 'should give wrong-answer reaction when user submits the scrambled version as the answer',
                testFunction: async () => {
                    // Arrange — answer stored is "cats"; scrambled display might be "tacs"
                    // Submitting the scrambled form is wrong (it is not the solution "cats")
                    const userAlice = await createTestUserAsync();
                    const testServer = await createTestServerAsync();
                    const channelId = await createTestChannelAsync();
                    const inputSimulator = TestInputSimulator.create();

                    const gameSaveModel = new GamesSaveModel({
                        ChannelId: channelId,
                        ServerId: testServer.ServerId!,
                        GameTypeEnum: GameTypeEnum.ANAGRAM,
                        Answer: 'cats'
                    });
                    await createTestGameAsync(gameSaveModel);

                    const eventBuilder = TestDiscordEventBuilder.create()
                        .withUser({ id: userAlice.UserId! })
                        .withServer({ id: testServer.ServerId! })
                        .withChannel({ id: channelId })
                        .withInputSimulator(inputSimulator);

                    // Submit the scrambled version (not the solution)
                    const answerEvent = eventBuilder.buildMessageEvent('tacs', userAlice.UserId!);

                    // Act
                    await GameService.handleGameAsync(answerEvent);

                    // Assert — wrong emoji reaction, no accept reaction
                    const reactions = inputSimulator.getTrackedReactions();
                    AssertionHelpers.assertReactionExists(reactions, DEFAULT_WRONG_ANSWER_EMOJI, undefined, 'Wrong-answer emoji should be set for scrambled submission');
                    AssertionHelpers.assertNoReactionExists(reactions, DEFAULT_ACCEPT_EMOJI, undefined, 'No accept reaction for wrong answer');

                    // No message deletion (Anagram does not delete on wrong answer)
                    AssertionHelpers.assertNoMessageWasDeleted(inputSimulator.getTrackedMessages(), channelId, 'Anagram does not delete messages on wrong answer');
                }
            },

            {
                name: 'should accept correct answer regardless of casing (case-insensitive match)',
                testFunction: async () => {
                    // Arrange — answer stored is "cats"; user submits "CATS"
                    const userAlice = await createTestUserAsync();
                    const testServer = await createTestServerAsync();
                    const channelId = await createTestChannelAsync();
                    const inputSimulator = TestInputSimulator.create();

                    const gameSaveModel = new GamesSaveModel({
                        ChannelId: channelId,
                        ServerId: testServer.ServerId!,
                        GameTypeEnum: GameTypeEnum.ANAGRAM,
                        Answer: 'cats'
                    });
                    await createTestGameAsync(gameSaveModel);

                    const eventBuilder = TestDiscordEventBuilder.create()
                        .withUser({ id: userAlice.UserId! })
                        .withServer({ id: testServer.ServerId! })
                        .withChannel({ id: channelId })
                        .withInputSimulator(inputSimulator);

                    // Submit in uppercase — should still match "cats"
                    const answerEvent = eventBuilder.buildMessageEvent('CATS', userAlice.UserId!);

                    // Act
                    await GameService.handleGameAsync(answerEvent);

                    // Assert — accept reaction, no wrong emoji
                    const reactions = inputSimulator.getTrackedReactions();
                    AssertionHelpers.assertReactionExists(reactions, DEFAULT_ACCEPT_EMOJI, undefined, 'Uppercase correct answer should be accepted');
                    AssertionHelpers.assertNoReactionExists(reactions, DEFAULT_WRONG_ANSWER_EMOJI, undefined, 'No wrong-answer emoji for correct answer');
                }
            }
        ]
    };

    runner.addSuite(suite);
}
