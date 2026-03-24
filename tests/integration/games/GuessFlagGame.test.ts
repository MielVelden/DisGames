import { GameTypeEnum } from '../../../src/interfaces/enums/database/GameTypeEnum';
import { TestInputSimulator } from '../../builders/TestInputSimulator';
import { createTestGameAsync } from '../../fixtures/games';
import { createTestUserAsync } from '../../fixtures/users';
import { createTestServerAsync } from '../../fixtures/servers';
import { createTestChannelAsync } from '../../fixtures/channels';
import AssertionHelpers from '../../helpers/AssertionHelpers';
import { DEFAULT_ACCEPT_EMOJI, DEFAULT_WRONG_ANSWER_EMOJI } from '../../../src/utils/constants/Emojis';
import TestRunner from '../../TestRunner';
import { TestSuite } from '../../interfaces/TestRunnerInterface';
import { TestDiscordEventBuilder } from '../../builders/TestDiscordEventBuilder';
import { GamesSaveModel } from '../../../src/interfaces/database/TableInterfaces';
import { LanguageEnum } from '../../../src/interfaces/enums/database/LanguageEnum';
import GameService from '../../../src/services/domain/GameService';
import GameRepository from '../../../src/repositories/GameRepository';

export default function registerGuessFlagGameTests(runner: TestRunner): void {
    const suite: TestSuite = {
        name: 'GuessFlagGame Integration',
        description: 'Integration tests for Guess the Flag game flows',

        setup: async () => {},
        teardown: async () => {},

        tests: [
            {
                name: 'should add accept reaction on correct country answer',
                testFunction: async () => {
                    // Arrange — current flag is the Netherlands; answer stored as "nederland" (NL server)
                    const userAlice = await createTestUserAsync();
                    const testServer = await createTestServerAsync();
                    const channelId = await createTestChannelAsync();
                    const inputSimulator = TestInputSimulator.create();

                    const gameSaveModel = new GamesSaveModel({
                        ChannelId: channelId,
                        ServerId: testServer.ServerId!,
                        GameTypeEnum: GameTypeEnum.GUESS_THE_FLAG,
                        Answer: 'nederland'
                    });
                    await createTestGameAsync(gameSaveModel);

                    const eventBuilder = TestDiscordEventBuilder.create()
                        .withUser({ id: userAlice.UserId! })
                        .withServer({ id: testServer.ServerId! })
                        .withChannel({ id: channelId })
                        .withInputSimulator(inputSimulator);

                    const answerEvent = eventBuilder.buildMessageEvent('nederland', userAlice.UserId!);

                    // Act — may throw NO_NEXT_ANSWER_FOUND if no flag data in test DB
                    try {
                        await GameService.handleGameAsync(answerEvent);
                    } catch {
                        // next-flag lookup may fail in CI; we only care about the reaction
                    }

                    // Assert — accept reaction set
                    const reactions = inputSimulator.getTrackedReactions();
                    AssertionHelpers.assertReactionExists(reactions, DEFAULT_ACCEPT_EMOJI, undefined, 'Accept reaction should be set on correct country answer');
                    AssertionHelpers.assertNoMessageWasDeleted(inputSimulator.getTrackedMessages(), channelId, 'Correct answer should not be deleted');
                }
            },

            {
                name: 'should add wrong-answer reaction and keep current flag on incorrect country answer',
                testFunction: async () => {
                    // Arrange — flag is Netherlands ("nederland"), user guesses "belgie"
                    const userAlice = await createTestUserAsync();
                    const testServer = await createTestServerAsync();
                    const channelId = await createTestChannelAsync();
                    const inputSimulator = TestInputSimulator.create();

                    const gameSaveModel = new GamesSaveModel({
                        ChannelId: channelId,
                        ServerId: testServer.ServerId!,
                        GameTypeEnum: GameTypeEnum.GUESS_THE_FLAG,
                        Answer: 'nederland'
                    });
                    const game = await createTestGameAsync(gameSaveModel);

                    const eventBuilder = TestDiscordEventBuilder.create()
                        .withUser({ id: userAlice.UserId! })
                        .withServer({ id: testServer.ServerId! })
                        .withChannel({ id: channelId })
                        .withInputSimulator(inputSimulator);

                    const answerEvent = eventBuilder.buildMessageEvent('belgie', userAlice.UserId!);

                    // Act
                    await GameService.handleGameAsync(answerEvent);

                    // Assert — wrong emoji, no accept, flag unchanged
                    const reactions = inputSimulator.getTrackedReactions();
                    AssertionHelpers.assertReactionExists(reactions, DEFAULT_WRONG_ANSWER_EMOJI, undefined, 'Wrong-answer emoji should be set for incorrect country');
                    AssertionHelpers.assertNoReactionExists(reactions, DEFAULT_ACCEPT_EMOJI, undefined, 'No accept reaction on wrong answer');
                    AssertionHelpers.assertNoMessageWasDeleted(inputSimulator.getTrackedMessages(), channelId, 'Wrong answer should not be deleted in Guess the Flag');

                    // Current flag answer must be unchanged
                    const finalGame = await GameRepository.getByIdAsync(game.Id!);
                    AssertionHelpers.assertEqual(finalGame!.Answer, 'nederland', 'Flag answer should remain unchanged on wrong guess');
                }
            },

            {
                name: 'should accept correct country name in EN on an EN server (MLS match)',
                testFunction: async () => {
                    // Arrange — EN server; answer stored as EN name "netherlands"
                    const userAlice = await createTestUserAsync();
                    const enServer = await createTestServerAsync({ LanguageEnum: LanguageEnum.EN });
                    const channelId = await createTestChannelAsync();
                    const inputSimulator = TestInputSimulator.create();

                    const gameSaveModel = new GamesSaveModel({
                        ChannelId: channelId,
                        ServerId: enServer.ServerId!,
                        GameTypeEnum: GameTypeEnum.GUESS_THE_FLAG,
                        Answer: 'netherlands'
                    });
                    await createTestGameAsync(gameSaveModel);

                    const eventBuilder = TestDiscordEventBuilder.create()
                        .withUser({ id: userAlice.UserId! })
                        .withServer({ id: enServer.ServerId!, languageEnum: LanguageEnum.EN })
                        .withChannel({ id: channelId })
                        .withInputSimulator(inputSimulator);

                    const answerEvent = eventBuilder.buildMessageEvent('netherlands', userAlice.UserId!);

                    // Act
                    try {
                        await GameService.handleGameAsync(answerEvent);
                    } catch {
                        // next-flag lookup may fail
                    }

                    // Assert — EN name accepted on EN server
                    const reactions = inputSimulator.getTrackedReactions();
                    AssertionHelpers.assertReactionExists(reactions, DEFAULT_ACCEPT_EMOJI, undefined, 'EN country name should be accepted on EN server');
                }
            },

            {
                name: 'should accept correct country name with lowercase and extra whitespace',
                testFunction: async () => {
                    // Arrange — answer is "nederland", user submits "  nederland  " (lowercase, extra spaces)
                    const userAlice = await createTestUserAsync();
                    const testServer = await createTestServerAsync();
                    const channelId = await createTestChannelAsync();
                    const inputSimulator = TestInputSimulator.create();

                    const gameSaveModel = new GamesSaveModel({
                        ChannelId: channelId,
                        ServerId: testServer.ServerId!,
                        GameTypeEnum: GameTypeEnum.GUESS_THE_FLAG,
                        Answer: 'nederland'
                    });
                    await createTestGameAsync(gameSaveModel);

                    const eventBuilder = TestDiscordEventBuilder.create()
                        .withUser({ id: userAlice.UserId! })
                        .withServer({ id: testServer.ServerId! })
                        .withChannel({ id: channelId })
                        .withInputSimulator(inputSimulator);

                    // Submit with extra whitespace
                    const answerEvent = eventBuilder.buildMessageEvent('  nederland  ', userAlice.UserId!);

                    // Act
                    try {
                        await GameService.handleGameAsync(answerEvent);
                    } catch {
                        // next-flag lookup may fail
                    }

                    // Assert — accepted after normalize/trim
                    const reactions = inputSimulator.getTrackedReactions();
                    AssertionHelpers.assertReactionExists(reactions, DEFAULT_ACCEPT_EMOJI, undefined, 'Country name with extra whitespace should be accepted after trimming');
                }
            }
        ]
    };

    runner.addSuite(suite);
}
