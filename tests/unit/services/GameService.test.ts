import TestRunner, { TestSuite } from '../../TestRunner';
import GameService from '../../../src/services/GameService';
import { GameTypeEnum } from '../../../src/interfaces/enums/database/GameTypeEnum';
import { TestDiscordEventBuilder } from '../../builders/TestDiscordEventBuilder';
import { TestInputSimulator } from '../../builders/TestInputSimulator';
import { createTestGame } from '../../fixtures/games';
import { TEST_SERVER_IDS, TEST_CHANNEL_IDS } from '../../fixtures/servers';
import { TEST_USER_IDS } from '../../fixtures/users';
import { DatabaseTestHelper } from '../../helpers/DatabaseTestHelper';
import AssertionHelpers from '../../helpers/AssertionHelpers';

export default function registerGameServiceTests(runner: TestRunner): void {
    const suite: TestSuite = {
        name: 'GameService',
        description: 'Unit tests for GameService functionality',
        
        setup: async () => {
            // Any setup needed for all tests in this suite
        },
        
        teardown: async () => {
            // Any cleanup needed after all tests in this suite
        },
        
        beforeEach: async () => {
            // Reset any state before each test
        },
        
        afterEach: async () => {
            // Clean up after each test
        },
        
        tests: [
            {
                name: 'should create anagram game successfully',
                testFunction: async () => {
                    // Arrange
                    await DatabaseTestHelper.insertTestData('servers', [{
                        ServerId: TEST_SERVER_IDS.MAIN_SERVER,
                        LanguageEnum: 2, // NL
                        Points: 0
                    }]);
                    
                    const eventBuilder = TestDiscordEventBuilder.create()
                        .withUser({ id: TEST_USER_IDS.PLAYER1 })
                        .withServer({ id: TEST_SERVER_IDS.MAIN_SERVER })
                        .withChannel({ id: TEST_CHANNEL_IDS.MAIN_CHANNEL });
                    
                    const event = eventBuilder.buildSlashCommandEvent('games', {
                        game: 'anagram'
                    });
                    
                    const gameData = createTestGame({
                        GameTypeEnum: GameTypeEnum.ANAGRAM,
                        ChannelId: TEST_CHANNEL_IDS.MAIN_CHANNEL,
                        ServerId: TEST_SERVER_IDS.MAIN_SERVER
                    });
                    
                    // Act
                    const result = await GameService.saveAsync(gameData, event);
                    
                    // Assert
                    AssertionHelpers.assertGameExists(result, 'Game should be created');
                    AssertionHelpers.assertEqual(result.GameTypeEnum, GameTypeEnum.ANAGRAM, 'Game type should be ANAGRAM');
                    AssertionHelpers.assertEqual(result.ChannelId, TEST_CHANNEL_IDS.MAIN_CHANNEL, 'Channel ID should match');
                    AssertionHelpers.assertEqual(result.ServerId, TEST_SERVER_IDS.MAIN_SERVER, 'Server ID should match');
                    AssertionHelpers.assertNotNull(result.Answer, 'Game should have an answer');
                }
            },
            
            {
                name: 'should get game by type',
                testFunction: async () => {
                    // Act
                    const anagramGame = GameService.getGameByType(GameTypeEnum.ANAGRAM);
                    const numberGuessGame = GameService.getGameByType(GameTypeEnum.NUMBER_GUESS);
                    
                    // Assert
                    AssertionHelpers.assertNotNull(anagramGame, 'Anagram game module should exist');
                    AssertionHelpers.assertNotNull(numberGuessGame, 'Number guess game module should exist');
                    AssertionHelpers.assertEqual(anagramGame?.config.id, GameTypeEnum.ANAGRAM, 'Anagram game ID should match');
                    AssertionHelpers.assertEqual(numberGuessGame?.config.id, GameTypeEnum.NUMBER_GUESS, 'Number guess game ID should match');
                }
            },
            
            {
                name: 'should validate game settings',
                testFunction: async () => {
                    // Arrange
                    const anagramGame = GameService.getGameByType(GameTypeEnum.ANAGRAM);
                    AssertionHelpers.assertNotNull(anagramGame, 'Anagram game should exist');
                    
                    const validSettings = {
                        difficulty: 'medium',
                        timeLimit: 60
                    };
                    
                    const invalidSettings = {
                        difficulty: 'invalid',
                        timeLimit: -1
                    };
                    
                    // Act & Assert
                    if (anagramGame?.config.settings) {
                        const validResult = GameService.validateSettings(anagramGame.config.settings, validSettings);
                        AssertionHelpers.assertEqual(validResult.isValid, true, 'Valid settings should pass validation');
                        
                        const invalidResult = GameService.validateSettings(anagramGame.config.settings, invalidSettings);
                        AssertionHelpers.assertEqual(invalidResult.isValid, false, 'Invalid settings should fail validation');
                    }
                }
            },
            
            {
                name: 'should handle duplicate game in channel',
                testFunction: async () => {
                    // Arrange
                    await DatabaseTestHelper.insertTestData('servers', [{
                        ServerId: TEST_SERVER_IDS.MAIN_SERVER,
                        LanguageEnum: 2, // NL
                        Points: 0
                    }]);
                    
                    const eventBuilder = TestDiscordEventBuilder.create()
                        .withUser({ id: TEST_USER_IDS.PLAYER1 })
                        .withServer({ id: TEST_SERVER_IDS.MAIN_SERVER })
                        .withChannel({ id: TEST_CHANNEL_IDS.MAIN_CHANNEL });
                    
                    const event = eventBuilder.buildSlashCommandEvent('games');
                    
                    const gameData1 = createTestGame({
                        GameTypeEnum: GameTypeEnum.ANAGRAM,
                        ChannelId: TEST_CHANNEL_IDS.MAIN_CHANNEL,
                        ServerId: TEST_SERVER_IDS.MAIN_SERVER
                    });
                    
                    const gameData2 = createTestGame({
                        GameTypeEnum: GameTypeEnum.NUMBER_GUESS,
                        ChannelId: TEST_CHANNEL_IDS.MAIN_CHANNEL,
                        ServerId: TEST_SERVER_IDS.MAIN_SERVER
                    });
                    
                    // Act
                    const firstGame = await GameService.saveAsync(gameData1, event);
                    AssertionHelpers.assertGameExists(firstGame, 'First game should be created');
                    
                    // Assert - Second game should throw error about duplicate
                    await AssertionHelpers.assertThrowsAsync(
                        () => GameService.saveAsync(gameData2, event),
                        undefined,
                        'Should throw error for duplicate game in channel'
                    );
                }
            }
        ]
    };
    
    runner.addSuite(suite);
}