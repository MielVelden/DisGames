import { GameTypeEnum } from '../../../src/interfaces/enums/database/GameTypeEnum';
import { GameFlowTestHelper } from '../../helpers/GameFlowTestHelper';
import { TestInputSimulator } from '../../builders/TestInputSimulator';
import { createGameFlowTestConfig, createTestGameAsync } from '../../fixtures/games';
import { createTestUserAsync, createTestUserByNameAsync } from '../../fixtures/users';
import AssertionHelpers from '../../helpers/AssertionHelpers';
import { DEFAULT_ACCEPT_EMOJI } from '../../../src/utils/constants/Emojis';
import TestRunner from '../../TestRunner';
import { TestSuite } from '../../interfaces/TestRunnerInterface';
import { ExceptionEnum, EventTypeEnum, UserRoleEnum } from '../../../src/interfaces/enums';
import { MockDiscordEvent } from '../../builders/TestDiscordEventBuilder';
import { MessageInteractionEvent } from '../../../src/interfaces/application/Event';
import { GamesSaveModel, ServersModel } from '../../../src/interfaces/database/TableInterfaces';
import { User } from '../../../src/interfaces/domain/User';
import { LanguageEnum } from '../../../src/interfaces/enums/database/LanguageEnum';
import { InteractionService } from '../../../src/services/application/InteractionService';
import GameService from '../../../src/services/domain/GameService';
import { createTestServerAsync } from '../../fixtures/servers';
import { createTestChannelAsync } from '../../fixtures/channels';

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
            },

            {
                name: 'should delete message and throw when last user edits their answer (MESSAGE_UPDATE)',
                testFunction: async () => {
                    // Arrange
                    const userAlice = await createTestUserAsync();
                    const testServer = await createTestServerAsync();
                    const channelId = await createTestChannelAsync();
                    const inputSimulator = TestInputSimulator.create();
                    const messageId = `msg_update_test_${Date.now()}`;

                    // Create a game where Alice was the last user
                    const gameSaveModel = new GamesSaveModel({
                        ChannelId: channelId,
                        ServerId: testServer.ServerId!,
                        GameTypeEnum: GameTypeEnum.WORD_SNAKE,
                        Answer: 'e',
                        LastUser: userAlice.UserId!,
                        MessageId: messageId
                    });
                    await createTestGameAsync(gameSaveModel);

                    // Build a MESSAGE_UPDATE event from Alice (who was the last user)
                    const updateEvent = buildEventWithType(
                        EventTypeEnum.MESSAGE_UPDATE,
                        'edited_word',
                        userAlice.UserId!,
                        channelId,
                        testServer.ServerId!,
                        messageId,
                        inputSimulator
                    );

                    // Act & Assert — must throw MESSAGE_CHANGE_DISABLED
                    await AssertionHelpers.assertThrowsAsync(
                        async () => await GameService.handleGameAsync(updateEvent),
                        ExceptionEnum.MESSAGE_CHANGE_DISABLED,
                        'Should throw MESSAGE_CHANGE_DISABLED when last user edits their message'
                    );

                    // Assert edited message was deleted (MESSAGE_UPDATE always deletes)
                    AssertionHelpers.assertAnyMessageWasDeleted(
                        inputSimulator.getTrackedMessages(),
                        'Edited message should be deleted'
                    );

                    // Assert a messageChanged component was added to the event
                    const components = (updateEvent as any).getComponents();
                    AssertionHelpers.assertGreaterThan(
                        components.length, 0,
                        'A messageChanged component should be sent'
                    );
                }
            },

            {
                name: 'should send component but NOT delete when last user externally deletes their message (MESSAGE_DELETE)',
                testFunction: async () => {
                    // Arrange
                    const userAlice = await createTestUserAsync();
                    const testServer = await createTestServerAsync();
                    const channelId = await createTestChannelAsync();
                    const inputSimulator = TestInputSimulator.create();
                    const messageId = `msg_delete_test_${Date.now()}`;

                    // Create a game where Alice was the last user
                    const gameSaveModel = new GamesSaveModel({
                        ChannelId: channelId,
                        ServerId: testServer.ServerId!,
                        GameTypeEnum: GameTypeEnum.WORD_SNAKE,
                        Answer: 'e',
                        LastUser: userAlice.UserId!,
                        MessageId: messageId
                    });
                    await createTestGameAsync(gameSaveModel);

                    // Build a MESSAGE_DELETE event (external — user deleted the message)
                    const deleteEvent = buildEventWithType(
                        EventTypeEnum.MESSAGE_DELETE,
                        '',
                        userAlice.UserId!,
                        channelId,
                        testServer.ServerId!,
                        messageId,
                        inputSimulator
                    );

                    // Act & Assert — must throw MESSAGE_CHANGE_DISABLED
                    await AssertionHelpers.assertThrowsAsync(
                        async () => await GameService.handleGameAsync(deleteEvent),
                        ExceptionEnum.MESSAGE_CHANGE_DISABLED,
                        'Should throw MESSAGE_CHANGE_DISABLED when last user externally deletes their message'
                    );

                    // Assert no additional delete was triggered (message already gone)
                    const deletedMessages = inputSimulator.getTrackedMessages().filter(m => m.isDeleted);
                    AssertionHelpers.assertEqual(
                        deletedMessages.length, 0,
                        'Bot should not try to delete a message that was already deleted externally'
                    );

                    // Assert a messageChanged component was added to the event
                    const components = (deleteEvent as any).getComponents();
                    AssertionHelpers.assertGreaterThan(
                        components.length, 0,
                        'A messageChanged component should be sent to inform the channel'
                    );
                }
            },

            {
                name: 'should NOT send component when bot internally deletes a message (isMessageInternallyDeleted)',
                testFunction: async () => {
                    // Arrange
                    const userAlice = await createTestUserAsync();
                    const testServer = await createTestServerAsync();
                    const channelId = await createTestChannelAsync();
                    const inputSimulator = TestInputSimulator.create();
                    const messageId = `msg_internal_delete_${Date.now()}`;

                    // Create a game where Alice was the last user
                    const gameSaveModel = new GamesSaveModel({
                        ChannelId: channelId,
                        ServerId: testServer.ServerId!,
                        GameTypeEnum: GameTypeEnum.WORD_SNAKE,
                        Answer: 'e',
                        LastUser: userAlice.UserId!,
                        MessageId: messageId
                    });
                    await createTestGameAsync(gameSaveModel);

                    // Mark the message as internally deleted before the event arrives
                    InteractionService.markMessageAsInternallyDeleted(messageId);

                    const internalDeleteEvent = buildEventWithType(
                        EventTypeEnum.MESSAGE_DELETE,
                        '',
                        userAlice.UserId!,
                        channelId,
                        testServer.ServerId!,
                        messageId,
                        inputSimulator
                    );

                    // Act & Assert — still throws MESSAGE_CHANGE_DISABLED (silently)
                    await AssertionHelpers.assertThrowsAsync(
                        async () => await GameService.handleGameAsync(internalDeleteEvent),
                        ExceptionEnum.MESSAGE_CHANGE_DISABLED,
                        'Should throw MESSAGE_CHANGE_DISABLED even for internal deletes'
                    );

                    // Assert NO component was added (internal delete = silent, no notification)
                    const components = (internalDeleteEvent as any).getComponents();
                    AssertionHelpers.assertEqual(
                        components.length, 0,
                        'No messageChanged component should be sent for internal bot deletes'
                    );

                    // Cleanup: remove the internal delete marker
                    InteractionService.removeInternallyDeletedMessage(messageId);
                }
            }
        ]
    };

    runner.addSuite(suite);
}
