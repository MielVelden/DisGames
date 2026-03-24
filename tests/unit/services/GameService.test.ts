import TestRunner from '../../TestRunner';
import { TestSuite } from '../../interfaces/TestRunnerInterface';
import GameService from '../../../src/services/domain/GameService';
import { GameTypeEnum } from '../../../src/interfaces/enums/database/GameTypeEnum';
import { TestDiscordEventBuilder } from '../../builders/TestDiscordEventBuilder';
import { createTestGameAsync } from '../../fixtures/games';
import { createTestServerAsync } from '../../fixtures/servers';
import { createTestUserAsync } from '../../fixtures/users';
import AssertionHelpers from '../../helpers/AssertionHelpers';
import { ExceptionEnum } from '../../../src/interfaces/enums';
import { GameSettingsValues } from '../../../src/interfaces/domain';
import { CommandEnum } from '../../../src/interfaces/enums/commands/CommandEnum';
import { createTestChannelAsync } from '../../fixtures/channels';

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
                    const testServer = await createTestServerAsync();
                    const userAlice = await createTestUserAsync();
                    const testChannel = await createTestChannelAsync();
                    
                    const eventBuilder = TestDiscordEventBuilder.create()
                        .withUser({ id: userAlice.UserId })
                        .withServer({ id: testServer.ServerId })
                        .withChannel({ id: testChannel });
                    
                    const event = eventBuilder.buildSlashCommandEvent(CommandEnum.GAMES, {
                        game: GameTypeEnum[GameTypeEnum.ANAGRAM].toLowerCase()
                    });
                    
                    const gameData = await createTestGameAsync({
                        GameTypeEnum: GameTypeEnum.ANAGRAM,
                        ChannelId: testChannel,
                        ServerId: testServer.ServerId
                    }, true);
                    
                    // Act
                    const result = await GameService.saveAsync(gameData, event);
                    
                    // Assert
                    AssertionHelpers.assertGameExists(result, 'Game should be created');
                    AssertionHelpers.assertEqual(result.GameTypeEnum, GameTypeEnum.ANAGRAM, 'Game type should be ANAGRAM');
                    AssertionHelpers.assertEqual(result.ChannelId, testChannel, 'Channel ID should match');
                    AssertionHelpers.assertEqual(result.ServerId, testServer.ServerId, 'Server ID should match');
                    AssertionHelpers.assertNotNull(result.Answer, 'Game should have an answer');
                }
            },
            
            {
                name: 'should get game by type',
                testFunction: async () => {
                    // Act
                    const anagramGame = GameService.getGameByTypeAsync(GameTypeEnum.ANAGRAM);
                    const numberGuessGame = GameService.getGameByTypeAsync(GameTypeEnum.NUMBER_GUESS);
                    
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
                    const countingGame = GameService.getGameByTypeAsync(GameTypeEnum.COUNTING);
                    AssertionHelpers.assertNotNull(countingGame, 'Counting game should exist');
                    
                    const validSettings: GameSettingsValues = {
                        resetOnFail: true,
                    };
                    
                    const invalidSettings: GameSettingsValues = {
                        resetOnFail: 'invalid',
                    };
                    
                    // Act & Assert
                    if (countingGame?.config.settings) {
                        const validResult = GameService.validateSettings(countingGame.config.settings, validSettings);
                        AssertionHelpers.assertEqual(validResult.isValid, true, 'Valid settings should pass validation');
                        
                        const invalidResult = GameService.validateSettings(countingGame.config.settings, invalidSettings);
                        AssertionHelpers.assertEqual(invalidResult.isValid, false, 'Invalid settings should fail validation');
                    }
                }
            },
            
            {
                name: 'should handle duplicate game in channel',
                testFunction: async () => {
                    // Arrange
                    const testServer = await createTestServerAsync();
                    const userAlice = await createTestUserAsync();
                    const testChannel = await createTestChannelAsync();

                    const eventBuilder = TestDiscordEventBuilder.create()
                        .withUser({ id: userAlice.UserId })
                        .withServer({ id: testServer.ServerId })
                        .withChannel({ id: testChannel });
                    
                    const event = eventBuilder.buildSlashCommandEvent(CommandEnum.GAMES);
                    
                    const gameData1 = await createTestGameAsync({
                        GameTypeEnum: GameTypeEnum.ANAGRAM,
                        ChannelId: testChannel,
                        ServerId: testServer.ServerId
                    }, true);
                    
                    const gameData2 = await createTestGameAsync({
                        GameTypeEnum: GameTypeEnum.NUMBER_GUESS,
                        ChannelId: testChannel,
                        ServerId: testServer.ServerId
                    }, true);
                    
                    // Act
                    const firstGame = await GameService.saveAsync(gameData1, event);
                    
                    // Assert - Second game should throw error about duplicate
                    AssertionHelpers.assertGameExists(firstGame, 'First game should be created');
                    
                    await AssertionHelpers.assertThrowsAsync(
                        () => GameService.saveAsync(gameData2, event),
                        ExceptionEnum.WANT_TO_REPLACE_CHANNEL,
                        'Should throw error for duplicate game in channel'
                    );
                }
            }
        ]
    };
    
    runner.addSuite(suite);
}