import { GameTypeEnum } from '../../../src/interfaces/enums/database/GameTypeEnum';
import { TestInputSimulator } from '../../builders/TestInputSimulator';
import { createTestGameAsync } from '../../fixtures/games';
import { createTestUserAsync, createTestUserByNameAsync } from '../../fixtures/users';
import { createTestServerAsync } from '../../fixtures/servers';
import { createTestChannelAsync } from '../../fixtures/channels';
import AssertionHelpers from '../../helpers/AssertionHelpers';
import { DEFAULT_ACCEPT_EMOJI, DEFAULT_WRONG_ANSWER_EMOJI } from '../../../src/utils/constants/Emojis';
import TestRunner from '../../TestRunner';
import { TestSuite } from '../../interfaces/TestRunnerInterface';
import { ExceptionEnum, EventTypeEnum, UserRoleEnum } from '../../../src/interfaces/enums';
import { MockDiscordEvent, TestDiscordEventBuilder } from '../../builders/TestDiscordEventBuilder';
import { MessageInteractionEvent } from '../../../src/interfaces/application/Event';
import { GamesSaveModel, ServersModel } from '../../../src/interfaces/database/TableInterfaces';
import { User } from '../../../src/interfaces/domain/User';
import { LanguageEnum } from '../../../src/interfaces/enums/database/LanguageEnum';
import { GameSettingsEnum } from '../../../src/interfaces/enums/games/GameSettingsEnum';
import GameService from '../../../src/services/domain/GameService';
import GameRepository from '../../../src/repositories/GameRepository';

// Helper: build a MESSAGE_UPDATE or MESSAGE_DELETE event directly
function buildEventWithType(
    type: EventTypeEnum.MESSAGE_UPDATE | EventTypeEnum.MESSAGE_DELETE,
    content: string,
    userId: string,
    channelId: string,
    serverId: string,
    messageId: string,
    inputSimulator: TestInputSimulator
): MessageInteractionEvent {
    const user: User = {
        id: undefined,
        userId,
        username: 'TestUser',
        displayName: 'TestUser',
        bot: false,
        hasPermissions: () => true,
        hasPermission: () => true,
        sendMessageAsync: async () => {},
        role: UserRoleEnum.USER
    };
    const server = new ServersModel({
        Id: 1,
        Name: 'TestServer',
        ServerId: serverId,
        LanguageEnum: LanguageEnum.EN,
        Points: 0
    });
    const mockInteraction = {
        content,
        author: { id: userId, bot: false },
        channel: { id: channelId },
        guild: { id: serverId },
        id: messageId,
    };
    const event = new MockDiscordEvent(
        type,
        content,
        mockInteraction,
        user,
        server,
        channelId,
        serverId,
        messageId,
        inputSimulator
    );
    event.content = content;
    return event as unknown as MessageInteractionEvent;
}

export default function registerCountingGameTests(runner: TestRunner): void {
    const suite: TestSuite = {
        name: 'CountingGame Integration',
        description: 'Integration tests for Counting game flows',

        setup: async () => {},
        teardown: async () => {},

        tests: [
            {
                name: 'should accept correct sequential answer and advance counter',
                testFunction: async () => {
                    // Arrange — counter is at 5, next expected is 5
                    const userAlice = await createTestUserAsync();
                    const testServer = await createTestServerAsync();
                    const channelId = await createTestChannelAsync();
                    const inputSimulator = TestInputSimulator.create();

                    const gameSaveModel = new GamesSaveModel({
                        ChannelId: channelId,
                        ServerId: testServer.ServerId!,
                        GameTypeEnum: GameTypeEnum.COUNTING,
                        Answer: '5'
                    });
                    const game = await createTestGameAsync(gameSaveModel);

                    const eventBuilder = TestDiscordEventBuilder.create()
                        .withUser({ id: userAlice.UserId! })
                        .withServer({ id: testServer.ServerId! })
                        .withChannel({ id: channelId })
                        .withInputSimulator(inputSimulator);

                    const answerEvent = eventBuilder.buildMessageEvent('5', userAlice.UserId!);

                    // Act
                    await GameService.handleGameAsync(answerEvent);

                    // Assert — accept reaction added, counter advanced to 6 in DB
                    const reactions = inputSimulator.getTrackedReactions();
                    AssertionHelpers.assertReactionExists(reactions, DEFAULT_ACCEPT_EMOJI, undefined, 'Accept reaction should be set on correct answer');

                    const finalGame = await GameRepository.getByIdAsync(game.Id!);
                    AssertionHelpers.assertNotNull(finalGame, 'Game should still exist');
                    AssertionHelpers.assertEqual(finalGame!.Answer, '6', 'Counter should advance to 6');

                    AssertionHelpers.assertNoMessageWasDeleted(inputSimulator.getTrackedMessages(), channelId, 'Correct answer should not be deleted');
                }
            },

            {
                name: 'should delete message and keep counter when wrong answer and resetOnFail=false',
                testFunction: async () => {
                    // Arrange — counter at 5, user skips to 7 (wrong), no reset
                    const userAlice = await createTestUserAsync();
                    const testServer = await createTestServerAsync();
                    const channelId = await createTestChannelAsync();
                    const inputSimulator = TestInputSimulator.create();

                    const gameSaveModel = new GamesSaveModel({
                        ChannelId: channelId,
                        ServerId: testServer.ServerId!,
                        GameTypeEnum: GameTypeEnum.COUNTING,
                        Answer: '5',
                        SettingsJSON: { [GameSettingsEnum.RESET_ON_FAIL]: false } as any
                    });
                    const game = await createTestGameAsync(gameSaveModel);

                    const eventBuilder = TestDiscordEventBuilder.create()
                        .withUser({ id: userAlice.UserId! })
                        .withServer({ id: testServer.ServerId! })
                        .withChannel({ id: channelId })
                        .withInputSimulator(inputSimulator);

                    const answerEvent = eventBuilder.buildMessageEvent('7', userAlice.UserId!);

                    // Act & Assert — WRONG_ANSWER must be thrown
                    await AssertionHelpers.assertThrowsAsync(
                        async () => await GameService.handleGameAsync(answerEvent),
                        ExceptionEnum.WRONG_ANSWER,
                        'Wrong answer without resetOnFail should throw WRONG_ANSWER'
                    );

                    // Message should be deleted
                    AssertionHelpers.assertAnyMessageWasDeleted(
                        inputSimulator.getTrackedMessages(),
                        'Wrong answer message should be deleted'
                    );

                    // Counter must NOT have been reset — still 5
                    const finalGame = await GameRepository.getByIdAsync(game.Id!);
                    AssertionHelpers.assertNotNull(finalGame, 'Game should still exist');
                    AssertionHelpers.assertEqual(finalGame!.Answer, '5', 'Counter should NOT reset when resetOnFail=false');
                }
            },

            {
                name: 'should reset counter to 1 and add reaction/component when wrong answer and resetOnFail=true',
                testFunction: async () => {
                    // Arrange — counter at 5, user skips to 7 (wrong), with reset
                    const userAlice = await createTestUserAsync();
                    const testServer = await createTestServerAsync();
                    const channelId = await createTestChannelAsync();
                    const inputSimulator = TestInputSimulator.create();

                    const gameSaveModel = new GamesSaveModel({
                        ChannelId: channelId,
                        ServerId: testServer.ServerId!,
                        GameTypeEnum: GameTypeEnum.COUNTING,
                        Answer: '5',
                        SettingsJSON: { [GameSettingsEnum.RESET_ON_FAIL]: true } as any
                    });
                    const game = await createTestGameAsync(gameSaveModel);

                    const eventBuilder = TestDiscordEventBuilder.create()
                        .withUser({ id: userAlice.UserId! })
                        .withServer({ id: testServer.ServerId! })
                        .withChannel({ id: channelId })
                        .withInputSimulator(inputSimulator);

                    const answerEvent = eventBuilder.buildMessageEvent('7', userAlice.UserId!);

                    // Act — should NOT throw when resetOnFail=true
                    await AssertionHelpers.assertDoesNotThrowAsync(
                        async () => await GameService.handleGameAsync(answerEvent),
                        'Wrong answer with resetOnFail=true should NOT throw'
                    );

                    // Wrong-answer emoji reaction should be added
                    const reactions = inputSimulator.getTrackedReactions();
                    AssertionHelpers.assertReactionExists(reactions, DEFAULT_WRONG_ANSWER_EMOJI, undefined, 'Wrong-answer emoji reaction should be set');

                    // Counter should be reset to 1 in DB
                    const finalGame = await GameRepository.getByIdAsync(game.Id!);
                    AssertionHelpers.assertNotNull(finalGame, 'Game should still exist');
                    AssertionHelpers.assertEqual(finalGame!.Answer, '1', 'Counter should reset to 1 when resetOnFail=true');

                    // Message should NOT be deleted
                    AssertionHelpers.assertNoMessageWasDeleted(inputSimulator.getTrackedMessages(), channelId, 'Message should not be deleted when resetOnFail=true');
                }
            },

            {
                name: 'should delete message and throw when same user tries to answer twice in a row',
                testFunction: async () => {
                    // Arrange — Alice was the last to count, she tries again
                    const userAlice = await createTestUserAsync();
                    const testServer = await createTestServerAsync();
                    const channelId = await createTestChannelAsync();
                    const inputSimulator = TestInputSimulator.create();

                    const gameSaveModel = new GamesSaveModel({
                        ChannelId: channelId,
                        ServerId: testServer.ServerId!,
                        GameTypeEnum: GameTypeEnum.COUNTING,
                        Answer: '5',
                        LastUser: userAlice.UserId!
                    });
                    await createTestGameAsync(gameSaveModel);

                    const eventBuilder = TestDiscordEventBuilder.create()
                        .withUser({ id: userAlice.UserId! })
                        .withServer({ id: testServer.ServerId! })
                        .withChannel({ id: channelId })
                        .withInputSimulator(inputSimulator);

                    const answerEvent = eventBuilder.buildMessageEvent('5', userAlice.UserId!);

                    // Act & Assert
                    await AssertionHelpers.assertThrowsAsync(
                        async () => await GameService.handleGameAsync(answerEvent),
                        ExceptionEnum.SAME_USER_ALREADY_ANSWERED,
                        'Same user answering twice should throw SAME_USER_ALREADY_ANSWERED'
                    );

                    // Message should be deleted
                    AssertionHelpers.assertAnyMessageWasDeleted(
                        inputSimulator.getTrackedMessages(),
                        'Message from same user should be deleted'
                    );
                }
            },

            {
                name: 'should delete edited message and send messageChanged component when last user edits their count (MESSAGE_UPDATE)',
                testFunction: async () => {
                    // Arrange — Alice counted last, she edits that message
                    const userAlice = await createTestUserAsync();
                    const testServer = await createTestServerAsync();
                    const channelId = await createTestChannelAsync();
                    const inputSimulator = TestInputSimulator.create();
                    const messageId = `msg_counting_update_${Date.now()}`;

                    const gameSaveModel = new GamesSaveModel({
                        ChannelId: channelId,
                        ServerId: testServer.ServerId!,
                        GameTypeEnum: GameTypeEnum.COUNTING,
                        Answer: '5',
                        LastUser: userAlice.UserId!,
                        MessageId: messageId
                    });
                    await createTestGameAsync(gameSaveModel);

                    const updateEvent = buildEventWithType(
                        EventTypeEnum.MESSAGE_UPDATE,
                        '123',
                        userAlice.UserId!,
                        channelId,
                        testServer.ServerId!,
                        messageId,
                        inputSimulator
                    );

                    // Act & Assert
                    await AssertionHelpers.assertThrowsAsync(
                        async () => await GameService.handleGameAsync(updateEvent),
                        ExceptionEnum.MESSAGE_CHANGE_DISABLED,
                        'Editing last answer should throw MESSAGE_CHANGE_DISABLED'
                    );

                    // Edited message should be deleted
                    AssertionHelpers.assertAnyMessageWasDeleted(
                        inputSimulator.getTrackedMessages(),
                        'Edited message should be deleted'
                    );

                    // messageChanged component should be sent
                    const components = (updateEvent as any).getComponents();
                    AssertionHelpers.assertGreaterThan(
                        components.length, 0,
                        'A messageChanged component should be sent'
                    );
                }
            },

            {
                name: 'should delete edited message and throw INVALID_NUMBER when last user edits their count to non-numeric value',
                testFunction: async () => {
                    // Arrange — Alice counted last, she edits that message
                    const userAlice = await createTestUserAsync();
                    const testServer = await createTestServerAsync();
                    const channelId = await createTestChannelAsync();
                    const inputSimulator = TestInputSimulator.create();
                    const messageId = `msg_counting_update_${Date.now()}`;

                    const gameSaveModel = new GamesSaveModel({
                        ChannelId: channelId,
                        ServerId: testServer.ServerId!,
                        GameTypeEnum: GameTypeEnum.COUNTING,
                        Answer: '5',
                        LastUser: userAlice.UserId!,
                        MessageId: messageId
                    });
                    await createTestGameAsync(gameSaveModel);

                    const updateEvent = buildEventWithType(
                        EventTypeEnum.MESSAGE_UPDATE,
                        'five',
                        userAlice.UserId!,
                        channelId,
                        testServer.ServerId!,
                        messageId,
                        inputSimulator
                    );

                    // Act & Assert
                    await AssertionHelpers.assertThrowsAsync(
                        async () => await GameService.handleGameAsync(updateEvent),
                        ExceptionEnum.INVALID_NUMBER,
                        'Editing last answer to non-numeric value should throw INVALID_NUMBER'
                    );

                    // Edited message should be deleted
                    AssertionHelpers.assertAnyMessageWasDeleted(
                        inputSimulator.getTrackedMessages(),
                        'Edited message should be deleted'
                    );
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
                        GameTypeEnum: GameTypeEnum.COUNTING,
                        Answer: '5'
                    });
                    await createTestGameAsync(gameSaveModel);

                    const eventBuilder = TestDiscordEventBuilder.create()
                        .withUser({ id: userAlice.UserId! })
                        .withServer({ id: testServer.ServerId! })
                        .withChannel({ id: channelId })
                        .withInputSimulator(inputSimulator);

                    // User sends "zes" (Dutch for "six") instead of "6"
                    const answerEvent = eventBuilder.buildMessageEvent('zes', userAlice.UserId!);

                    // Act & Assert — INVALID_NUMBER thrown before game logic
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
