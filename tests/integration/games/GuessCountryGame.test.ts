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
import GameService from '../../../src/services/domain/GameService';
import GameRepository from '../../../src/repositories/GameRepository';

export default function registerGuessCountryGameTests(runner: TestRunner): void {
    const suite: TestSuite = {
        name: 'GuessCountryGame Integration',
        description: 'Integration tests for Guess the Country game flows',
        disabled: true,
        
        setup: async () => {},
        teardown: async () => {},

        tests: [
            {
                name: 'should add accept reaction on correct country answer',
                testFunction: async () => {
                    // Arrange — current answer is "france"
                    const userAlice = await createTestUserAsync();
                    const testServer = await createTestServerAsync();
                    const channelId = await createTestChannelAsync();
                    const inputSimulator = TestInputSimulator.create();

                    const gameSaveModel = new GamesSaveModel({
                        ChannelId: channelId,
                        ServerId: testServer.ServerId!,
                        GameTypeEnum: GameTypeEnum.GUESS_THE_COUNTRY,
                        Answer: 'france'
                    });
                    await createTestGameAsync(gameSaveModel);

                    const eventBuilder = TestDiscordEventBuilder.create()
                        .withUser({ id: userAlice.UserId! })
                        .withServer({ id: testServer.ServerId! })
                        .withChannel({ id: channelId })
                        .withInputSimulator(inputSimulator);

                    const answerEvent = eventBuilder.buildMessageEvent('france', userAlice.UserId!);

                    // Act — may throw NO_NEXT_ANSWER_FOUND if no country data in test DB
                    try {
                        await GameService.handleGameAsync(answerEvent);
                    } catch {
                        // next-country lookup may fail in CI; we only care about the reaction
                    }

                    // Assert — accept reaction set
                    const reactions = inputSimulator.getTrackedReactions();
                    AssertionHelpers.assertReactionExists(reactions, DEFAULT_ACCEPT_EMOJI, undefined, 'Accept reaction should be set on correct country answer');
                    AssertionHelpers.assertNoMessageWasDeleted(inputSimulator.getTrackedMessages(), channelId, 'Correct answer should not be deleted');
                }
            },

            {
                name: 'should add wrong-answer reaction and keep current country on incorrect answer',
                testFunction: async () => {
                    // Arrange — answer is "france", user guesses "germany"
                    const userAlice = await createTestUserAsync();
                    const testServer = await createTestServerAsync();
                    const channelId = await createTestChannelAsync();
                    const inputSimulator = TestInputSimulator.create();

                    const gameSaveModel = new GamesSaveModel({
                        ChannelId: channelId,
                        ServerId: testServer.ServerId!,
                        GameTypeEnum: GameTypeEnum.GUESS_THE_COUNTRY,
                        Answer: 'france'
                    });
                    const game = await createTestGameAsync(gameSaveModel);

                    const eventBuilder = TestDiscordEventBuilder.create()
                        .withUser({ id: userAlice.UserId! })
                        .withServer({ id: testServer.ServerId! })
                        .withChannel({ id: channelId })
                        .withInputSimulator(inputSimulator);

                    const answerEvent = eventBuilder.buildMessageEvent('germany', userAlice.UserId!);

                    // Act
                    await GameService.handleGameAsync(answerEvent);

                    // Assert — wrong emoji, no accept, country unchanged
                    const reactions = inputSimulator.getTrackedReactions();
                    AssertionHelpers.assertReactionExists(reactions, DEFAULT_WRONG_ANSWER_EMOJI, undefined, 'Wrong-answer emoji should be set for incorrect country');
                    AssertionHelpers.assertNoReactionExists(reactions, DEFAULT_ACCEPT_EMOJI, undefined, 'No accept reaction on wrong answer');
                    AssertionHelpers.assertNoMessageWasDeleted(inputSimulator.getTrackedMessages(), channelId, 'Wrong answer should not be deleted in Guess the Country');

                    // Current country answer must be unchanged
                    const finalGame = await GameRepository.getByIdAsync(game.Id!);
                    AssertionHelpers.assertEqual(finalGame!.Answer, 'france', 'Country answer should remain unchanged on wrong guess');
                }
            },

            {
                name: 'should accept correct country name with lowercase and extra whitespace',
                testFunction: async () => {
                    // Arrange — answer is "france", user submits "  france  " (lowercase, extra spaces)
                    const userAlice = await createTestUserAsync();
                    const testServer = await createTestServerAsync();
                    const channelId = await createTestChannelAsync();
                    const inputSimulator = TestInputSimulator.create();

                    const gameSaveModel = new GamesSaveModel({
                        ChannelId: channelId,
                        ServerId: testServer.ServerId!,
                        GameTypeEnum: GameTypeEnum.GUESS_THE_COUNTRY,
                        Answer: 'france'
                    });
                    await createTestGameAsync(gameSaveModel);

                    const eventBuilder = TestDiscordEventBuilder.create()
                        .withUser({ id: userAlice.UserId! })
                        .withServer({ id: testServer.ServerId! })
                        .withChannel({ id: channelId })
                        .withInputSimulator(inputSimulator);

                    // Submit with extra whitespace
                    const answerEvent = eventBuilder.buildMessageEvent('  france  ', userAlice.UserId!);

                    // Act
                    try {
                        await GameService.handleGameAsync(answerEvent);
                    } catch {
                        // next-country lookup may fail
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
