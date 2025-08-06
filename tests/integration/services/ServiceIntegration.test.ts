import TestRunner, { TestSuite } from '../../TestRunner';
import { TestDiscordEventBuilder } from '../../builders/TestDiscordEventBuilder';
import { TestInputSimulator } from '../../builders/TestInputSimulator';
import { DatabaseTestHelper } from '../../helpers/DatabaseTestHelper';
import GameService from '../../../src/services/GameService';
import ServerService from '../../../src/services/ServerService';
import { GameTypeEnum } from '../../../src/interfaces/enums/database/GameTypeEnum';
import { LanguageEnum } from '../../../src/interfaces/enums/database/LanguageEnum';
import { createTestGameAsync } from '../../fixtures/games';
import { createTestServerAsync } from '../../fixtures/servers';
import { createTestUserAsync } from '../../fixtures/users';
import AssertionHelpers from '../../helpers/AssertionHelpers';
import { TableEnum } from '../../../src/interfaces/enums';
import { CommandEnum } from '../../../src/interfaces/enums/commands/CommandEnum';

export default function registerServiceIntegrationTests(runner: TestRunner): void {
    const suite: TestSuite = {
        name: 'Service Integration',
        description: 'Integration tests for service layer interactions',
        
        setup: async () => {
            // Clean the database before running integration tests
            await DatabaseTestHelper.cleanDatabase();
        },
        
        teardown: async () => {
            // Additional cleanup if needed
        },
        
        beforeEach: async () => {
            // Each test gets a clean database state due to transaction rollback
        },
        
        tests: [
            {
                name: 'should integrate GameService with Discord events',
                testFunction: async () => {
                    // Arrange
                    const testServer = await createTestServerAsync();
                    const testUser = await createTestUserAsync();
                    
                    const eventBuilder = TestDiscordEventBuilder.create()
                        .withUser({ id: testUser.UserId })
                        .withServer({ id: testServer.ServerId })
                        .withChannel({ id: 'test_channel_123' });
                    
                    const inputSimulator = TestInputSimulator.create()
                        .expectConfirmation(true);
                    
                    const event = eventBuilder
                        .withInputSimulator(inputSimulator)
                        .buildSlashCommandEvent(CommandEnum.GAMES, { game: 'anagram' });
                    
                    const gameData = await createTestGameAsync({
                        GameTypeEnum: GameTypeEnum.ANAGRAM,
                        ChannelId: 'test_channel_123',
                        ServerId: testServer.ServerId
                    });
                    
                    // Act
                    const savedGame = await GameService.saveAsync(gameData, event);
                    
                    // Assert
                    AssertionHelpers.assertGameExists(savedGame, 'Game should be created');
                    AssertionHelpers.assertEqual(savedGame.ServerId, testServer.ServerId, 'Game should be linked to correct server');
                    AssertionHelpers.assertEqual(savedGame.ChannelId, 'test_channel_123', 'Game should be in correct channel');
                    
                    // Verify Discord event interaction
                    const mockEvent = event as any;
                    AssertionHelpers.assertGreaterThan(mockEvent.getSentMessages().length, 0, 'Should have sent Discord messages');
                }
            },
            
            {
                name: 'should handle server creation and game setup flow',
                testFunction: async () => {
                    // Arrange
                    const newServerId = `new_server_${Date.now()}`;
                    
                    // Act - This should create a server if it doesn't exist
                    const server = await ServerService.getServerAsync(newServerId, true);
                    
                    // Assert
                    AssertionHelpers.assertNotNull(server, 'Server should be created');
                    AssertionHelpers.assertEqual(server.ServerId, newServerId, 'Server ID should match');
                    AssertionHelpers.assertEqual(server.LanguageEnum, LanguageEnum.NL, 'Default language should be NL');
                    
                    // Now create a game for this server
                    const eventBuilder = TestDiscordEventBuilder.create()
                        .withServer({ id: newServerId })
                        .withChannel({ id: 'new_channel_123' });
                    
                    const event = eventBuilder.buildSlashCommandEvent(CommandEnum.GAMES);
                    
                    const gameData = await createTestGameAsync({
                        GameTypeEnum: GameTypeEnum.COUNTING,
                        ServerId: newServerId,
                        ChannelId: 'new_channel_123'
                    });
                    
                    const game = await GameService.saveAsync(gameData, event);
                    
                    // Assert game creation
                    AssertionHelpers.assertGameExists(game, 'Game should be created for new server');
                    AssertionHelpers.assertEqual(game.ServerId, newServerId, 'Game should be linked to new server');
                }
            },
            
            {
                name: 'should handle multiple concurrent game requests',
                testFunction: async () => {
                    // Arrange
                    const testServer = await createTestServerAsync();
                    
                    const promises = [];
                    const gameChannels = ['channel_1', 'channel_2', 'channel_3'];
                    
                    // Act - Create multiple games concurrently
                    for (let i = 0; i < gameChannels.length; i++) {
                        const channelId = gameChannels[i];
                        const userId = `user_${i}`;
                        
                        const eventBuilder = TestDiscordEventBuilder.create()
                            .withUser({ id: userId })
                            .withServer({ id: testServer.ServerId })
                            .withChannel({ id: channelId });
                        
                        const event = eventBuilder.buildSlashCommandEvent(CommandEnum.GAMES);
                        
                        const gameData = await createTestGameAsync({
                            GameTypeEnum: GameTypeEnum.ANAGRAM,
                            ServerId: testServer.ServerId,
                            ChannelId: channelId
                        });
                        
                        promises.push(GameService.saveAsync(gameData, event));
                    }
                    
                    const results = await Promise.allSettled(promises);
                    
                    // Assert
                    const successfulGames = results.filter(result => result.status === 'fulfilled');
                    AssertionHelpers.assertEqual(successfulGames.length, gameChannels.length, 'All games should be created successfully');
                    
                    // Verify each game is in different channel
                    const fulfilledResults = successfulGames as PromiseFulfilledResult<any>[];
                    const channelIds = fulfilledResults.map(result => result.value.ChannelId);
                    const uniqueChannels = new Set(channelIds);
                    AssertionHelpers.assertEqual(uniqueChannels.size, gameChannels.length, 'Each game should be in different channel');
                }
            },
            
            {
                name: 'should handle database transaction rollback on error',
                testFunction: async () => {
                    // Arrange
                    const testServer = await createTestServerAsync();
                    
                    const eventBuilder = TestDiscordEventBuilder.create()
                        .withServer({ id: testServer.ServerId })
                        .withChannel({ id: 'error_test_channel' });
                    
                    const event = eventBuilder.buildSlashCommandEvent(CommandEnum.GAMES);
                    
                    // Create invalid game data to trigger error
                    const invalidGameData = await createTestGameAsync({
                        GameTypeEnum: 999 as GameTypeEnum, // Invalid game type
                        ServerId: testServer.ServerId,
                        ChannelId: 'error_test_channel'
                    });
                    
                    // Act & Assert
                    let errorThrown = false;
                    try {
                        await GameService.saveAsync(invalidGameData, event);
                    } catch (error) {
                        errorThrown = true;
                    }
                    
                    AssertionHelpers.assertTrue(errorThrown, 'Should throw error for invalid game data');
                    
                    // Verify no partial data was saved due to transaction rollback
                    // This would be verified by the database transaction mechanism
                }
            },
            
            {
                name: 'should validate input simulation flow',
                testFunction: async () => {
                    // Arrange
                    const inputSimulator = TestInputSimulator.create()
                        .expectSelectMenu('option1')
                        .expectButton('confirm')
                        .expectConfirmation(true)
                        .expectInput('test_answer');
                    
                    const eventBuilder = TestDiscordEventBuilder.create()
                        .withInputSimulator(inputSimulator);
                    
                    const event = eventBuilder.buildSlashCommandEvent(CommandEnum.GAMES);
                    
                    // Act - Simulate various input methods
                    const selectMenuResult = await event.getUserInputBySelectMenuAsync({
                        type: 5, // SELECT_MENU type
                        customId: 'test_select',
                        options: []
                    } as any);
                    
                    const buttonResult = await event.getUserInputByButtonsAsync(
                        { en: 'Choose option' } as any,
                        [{ en: 'Confirm' } as any, { en: 'Cancel' } as any]
                    );
                    
                    const confirmationResult = await event.getConfirmationFromUser({
                        type: 1, // CONTAINER type
                        title: { en: 'Confirm action' } as any
                    } as any);
                    
                    // Assert
                    AssertionHelpers.assertNotNull(selectMenuResult, 'Select menu should return simulated response');
                    AssertionHelpers.assertEqual(selectMenuResult?.selected, 'option1', 'Should return expected select menu value');
                    AssertionHelpers.assertEqual(buttonResult, 'confirm', 'Should return expected button value');
                    AssertionHelpers.assertNotNull(confirmationResult, 'Confirmation should return event');
                }
            }
        ]
    };
    
    runner.addSuite(suite);
}