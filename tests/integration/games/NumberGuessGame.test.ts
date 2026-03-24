import { GameTypeEnum } from '../../../src/interfaces/enums/database/GameTypeEnum';
import { TestInputSimulator } from '../../builders/TestInputSimulator';
import { createTestGameAsync } from '../../fixtures/games';
import { createTestUserAsync } from '../../fixtures/users';
import { createTestServerAsync } from '../../fixtures/servers';
import { createTestChannelAsync } from '../../fixtures/channels';
import AssertionHelpers from '../../helpers/AssertionHelpers';
import { DEFAULT_ACCEPT_EMOJI } from '../../../src/utils/constants/Emojis';
import TestRunner from '../../TestRunner';
import { TestSuite } from '../../interfaces/TestRunnerInterface';
import { ExceptionEnum } from '../../../src/interfaces/enums';
import { TestDiscordEventBuilder } from '../../builders/TestDiscordEventBuilder';
import { GamesSaveModel } from '../../../src/interfaces/database/TableInterfaces';
import GameService from '../../../src/services/domain/GameService';
import GameRepository from '../../../src/repositories/GameRepository';

const HINT_UP_EMOJI = '🔼';
const HINT_DOWN_EMOJI = '🔽';
const SECRET_NUMBER = 42;
const MAX_NUMBER = 10000;

export default function registerNumberGuessGameTests(runner: TestRunner): void {
    const suite: TestSuite = {
        name: 'NumberGuessGame Integration',
        description: 'Integration tests for Number Guess game flows (hint reactions, correct answer)',

        setup: async () => {},
        teardown: async () => {},

        tests: [
            {
                name: 'should add accept reaction and generate new secret number on correct guess',
                testFunction: async () => {
                    // Arrange — secret number is 42
                    const userAlice = await createTestUserAsync();
                    const testServer = await createTestServerAsync();
                    const channelId = await createTestChannelAsync();
                    const inputSimulator = TestInputSimulator.create();

                    const gameSaveModel = new GamesSaveModel({
                        ChannelId: channelId,
                        ServerId: testServer.ServerId!,
                        GameTypeEnum: GameTypeEnum.NUMBER_GUESS,
                        Answer: String(SECRET_NUMBER)
                    });
                    const game = await createTestGameAsync(gameSaveModel);

                    const eventBuilder = TestDiscordEventBuilder.create()
                        .withUser({ id: userAlice.UserId! })
                        .withServer({ id: testServer.ServerId! })
                        .withChannel({ id: channelId })
                        .withInputSimulator(inputSimulator);

                    const answerEvent = eventBuilder.buildMessageEvent(String(SECRET_NUMBER), userAlice.UserId!);

                    // Act
                    await GameService.handleGameAsync(answerEvent);

                    // Assert — accept reaction set
                    const reactions = inputSimulator.getTrackedReactions();
                    AssertionHelpers.assertReactionExists(reactions, DEFAULT_ACCEPT_EMOJI, undefined, 'Accept reaction should be set on correct guess');

                    // A new secret number must have been stored (verify it differs from 42)
                    const finalGame = await GameRepository.getByIdAsync(game.Id!);
                    AssertionHelpers.assertNotNull(finalGame, 'Game should still exist');
                    AssertionHelpers.assertNotEqual(
                        finalGame!.Answer,
                        String(SECRET_NUMBER),
                        'A new secret number should be generated after correct guess'
                    );

                    // Message should NOT be deleted on correct guess
                    AssertionHelpers.assertNoMessageWasDeleted(inputSimulator.getTrackedMessages(), channelId, 'Correct guess should not be deleted');
                }
            },

            {
                name: 'should add 🔼 hint reaction when guess is too low',
                testFunction: async () => {
                    // Arrange — secret is 42, user guesses 30 (too low)
                    const userAlice = await createTestUserAsync();
                    const testServer = await createTestServerAsync();
                    const channelId = await createTestChannelAsync();
                    const inputSimulator = TestInputSimulator.create();

                    const gameSaveModel = new GamesSaveModel({
                        ChannelId: channelId,
                        ServerId: testServer.ServerId!,
                        GameTypeEnum: GameTypeEnum.NUMBER_GUESS,
                        Answer: String(SECRET_NUMBER)
                    });
                    const game = await createTestGameAsync(gameSaveModel);

                    const eventBuilder = TestDiscordEventBuilder.create()
                        .withUser({ id: userAlice.UserId! })
                        .withServer({ id: testServer.ServerId! })
                        .withChannel({ id: channelId })
                        .withInputSimulator(inputSimulator);

                    const answerEvent = eventBuilder.buildMessageEvent('30', userAlice.UserId!);

                    // Act
                    await GameService.handleGameAsync(answerEvent);

                    // Assert — 🔼 hint reaction
                    const reactions = inputSimulator.getTrackedReactions();
                    AssertionHelpers.assertReactionExists(reactions, HINT_UP_EMOJI, undefined, '🔼 hint should be set when guess is too low');
                    AssertionHelpers.assertNoReactionExists(reactions, DEFAULT_ACCEPT_EMOJI, undefined, 'No accept reaction for wrong guess');
                    AssertionHelpers.assertNoReactionExists(reactions, HINT_DOWN_EMOJI, undefined, 'No 🔽 hint for too-low guess');

                    // Message should NOT be deleted
                    AssertionHelpers.assertNoMessageWasDeleted(inputSimulator.getTrackedMessages(), channelId, 'Guess message should not be deleted');

                    // Secret number must be unchanged
                    const finalGame = await GameRepository.getByIdAsync(game.Id!);
                    AssertionHelpers.assertEqual(finalGame!.Answer, String(SECRET_NUMBER), 'Secret number should not change on wrong guess');
                }
            },

            {
                name: 'should add 🔽 hint reaction when guess is too high',
                testFunction: async () => {
                    // Arrange — secret is 42, user guesses 80 (too high)
                    const userAlice = await createTestUserAsync();
                    const testServer = await createTestServerAsync();
                    const channelId = await createTestChannelAsync();
                    const inputSimulator = TestInputSimulator.create();

                    const gameSaveModel = new GamesSaveModel({
                        ChannelId: channelId,
                        ServerId: testServer.ServerId!,
                        GameTypeEnum: GameTypeEnum.NUMBER_GUESS,
                        Answer: String(SECRET_NUMBER)
                    });
                    const game = await createTestGameAsync(gameSaveModel);

                    const eventBuilder = TestDiscordEventBuilder.create()
                        .withUser({ id: userAlice.UserId! })
                        .withServer({ id: testServer.ServerId! })
                        .withChannel({ id: channelId })
                        .withInputSimulator(inputSimulator);

                    const answerEvent = eventBuilder.buildMessageEvent('80', userAlice.UserId!);

                    // Act
                    await GameService.handleGameAsync(answerEvent);

                    // Assert — 🔽 hint reaction
                    const reactions = inputSimulator.getTrackedReactions();
                    AssertionHelpers.assertReactionExists(reactions, HINT_DOWN_EMOJI, undefined, '🔽 hint should be set when guess is too high');
                    AssertionHelpers.assertNoReactionExists(reactions, DEFAULT_ACCEPT_EMOJI, undefined, 'No accept reaction for wrong guess');
                    AssertionHelpers.assertNoReactionExists(reactions, HINT_UP_EMOJI, undefined, 'No 🔼 hint for too-high guess');

                    // Message should NOT be deleted
                    AssertionHelpers.assertNoMessageWasDeleted(inputSimulator.getTrackedMessages(), channelId, 'Guess message should not be deleted');

                    // Secret number must be unchanged
                    const finalGame = await GameRepository.getByIdAsync(game.Id!);
                    AssertionHelpers.assertEqual(finalGame!.Answer, String(SECRET_NUMBER), 'Secret number should not change on wrong guess');
                }
            },

            {
                name: 'should give 🔼 hint for boundary minimum guess (1)',
                testFunction: async () => {
                    // Arrange — secret is 42, user guesses 1 (minimum possible, always too low)
                    const userAlice = await createTestUserAsync();
                    const testServer = await createTestServerAsync();
                    const channelId = await createTestChannelAsync();
                    const inputSimulator = TestInputSimulator.create();

                    const gameSaveModel = new GamesSaveModel({
                        ChannelId: channelId,
                        ServerId: testServer.ServerId!,
                        GameTypeEnum: GameTypeEnum.NUMBER_GUESS,
                        Answer: String(SECRET_NUMBER)
                    });
                    await createTestGameAsync(gameSaveModel);

                    const eventBuilder = TestDiscordEventBuilder.create()
                        .withUser({ id: userAlice.UserId! })
                        .withServer({ id: testServer.ServerId! })
                        .withChannel({ id: channelId })
                        .withInputSimulator(inputSimulator);

                    const answerEvent = eventBuilder.buildMessageEvent('1', userAlice.UserId!);

                    // Act
                    await GameService.handleGameAsync(answerEvent);

                    // Assert
                    const reactions = inputSimulator.getTrackedReactions();
                    AssertionHelpers.assertReactionExists(reactions, HINT_UP_EMOJI, undefined, 'Boundary minimum should get 🔼 hint');
                }
            },

            {
                name: 'should give 🔽 hint for boundary maximum guess (10000)',
                testFunction: async () => {
                    // Arrange — secret is 42, user guesses 10000 (maximum possible, always too high)
                    const userAlice = await createTestUserAsync();
                    const testServer = await createTestServerAsync();
                    const channelId = await createTestChannelAsync();
                    const inputSimulator = TestInputSimulator.create();

                    const gameSaveModel = new GamesSaveModel({
                        ChannelId: channelId,
                        ServerId: testServer.ServerId!,
                        GameTypeEnum: GameTypeEnum.NUMBER_GUESS,
                        Answer: String(SECRET_NUMBER)
                    });
                    await createTestGameAsync(gameSaveModel);

                    const eventBuilder = TestDiscordEventBuilder.create()
                        .withUser({ id: userAlice.UserId! })
                        .withServer({ id: testServer.ServerId! })
                        .withChannel({ id: channelId })
                        .withInputSimulator(inputSimulator);

                    const answerEvent = eventBuilder.buildMessageEvent(String(MAX_NUMBER), userAlice.UserId!);

                    // Act
                    await GameService.handleGameAsync(answerEvent);

                    // Assert
                    const reactions = inputSimulator.getTrackedReactions();
                    AssertionHelpers.assertReactionExists(reactions, HINT_DOWN_EMOJI, undefined, 'Boundary maximum should get 🔽 hint');
                }
            },

            {
                name: 'should delete message and throw INVALID_NUMBER for non-numeric input',
                testFunction: async () => {
                    // Arrange
                    const userAlice = await createTestUserAsync();
                    const testServer = await createTestServerAsync();
                    const channelId = await createTestChannelAsync();
                    const inputSimulator = TestInputSimulator.create();

                    const gameSaveModel = new GamesSaveModel({
                        ChannelId: channelId,
                        ServerId: testServer.ServerId!,
                        GameTypeEnum: GameTypeEnum.NUMBER_GUESS,
                        Answer: String(SECRET_NUMBER)
                    });
                    await createTestGameAsync(gameSaveModel);

                    const eventBuilder = TestDiscordEventBuilder.create()
                        .withUser({ id: userAlice.UserId! })
                        .withServer({ id: testServer.ServerId! })
                        .withChannel({ id: channelId })
                        .withInputSimulator(inputSimulator);

                    // User sends text instead of a number
                    const answerEvent = eventBuilder.buildMessageEvent('honderd', userAlice.UserId!);

                    // Act & Assert
                    await AssertionHelpers.assertThrowsAsync(
                        async () => await GameService.handleGameAsync(answerEvent),
                        ExceptionEnum.INVALID_NUMBER,
                        'Non-numeric input should throw INVALID_NUMBER'
                    );

                    // Message should be deleted
                    AssertionHelpers.assertAnyMessageWasDeleted(
                        inputSimulator.getTrackedMessages(),
                        'Non-numeric message should be deleted'
                    );
                }
            }
        ]
    };

    runner.addSuite(suite);
}
