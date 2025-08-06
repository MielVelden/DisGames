import TestRunner, { TestSuite } from '../TestRunner';
import { GameTypeEnum } from '../../src/interfaces/enums/database/GameTypeEnum';
import { GameFlowTestHelper } from '../helpers/GameFlowTestHelper';
import { TestDiscordEventBuilder } from '../builders/TestDiscordEventBuilder';
import { TestInputSimulator } from '../builders/TestInputSimulator';
import { createTestGameAsync, GAME_TEST_ANSWERS } from '../fixtures/games';
import { TEST_SERVER_IDS, TEST_CHANNEL_IDS } from '../fixtures/servers';
import { TEST_USER_IDS } from '../fixtures/users';
import { DatabaseTestHelper } from '../helpers/DatabaseTestHelper';
import { 
    assertEqual, 
    assertNotNull, 
    assertGameFlowSuccess,
    assertGameExists,
    assertGreaterThan
} from '../helpers/AssertionHelpers';
import { TestDatabase } from '../config/TestDatabase';
import Logger from '../../src/utils/Logger';
import { LanguageEnum, TableEnum } from '../../src/interfaces/enums';
import { CommandEnum } from '../../src/interfaces/enums/commands/CommandEnum';

export default function registerExampleTests(runner: TestRunner): void {
    const suite: TestSuite = {
        name: 'Example Tests',
        description: 'Voorbeelden van hoe verschillende test scenarios te implementeren',
        
        setup: async () => {
            await Logger.logTest('[EXAMPLE] Suite setup - voorbereiden van test omgeving');
        },
        
        teardown: async () => {
            await Logger.logTest('[EXAMPLE] Suite teardown - opruimen na alle tests');
        },
        
        beforeEach: async () => {
            await Logger.logTest('[EXAMPLE] Before each test - reset state');
        },
        
        afterEach: async () => {
            await Logger.logTest('[EXAMPLE] After each test - cleanup');
        },
        
        tests: [
            {
                name: 'Voorbeeld 1: Eenvoudige game creation test',
                description: 'Toont hoe je een simpele game test opzet',
                testFunction: async () => {
                    await Logger.logTest('[EXAMPLE] Test 1: Simpele game creation');
                    
                    // 1. Arrange - Stel test data op
                    const eventBuilder = TestDiscordEventBuilder.create()
                        .withUser({ id: TEST_USER_IDS.PLAYER1, username: 'TestSpeler' })
                        .withServer({ id: TEST_SERVER_IDS.MAIN_SERVER, name: 'Test Server' })
                        .withChannel({ id: TEST_CHANNEL_IDS.MAIN_CHANNEL, name: 'test-channel' });
                    
                    const event = eventBuilder.buildSlashCommandEvent(CommandEnum.GAMES, {
                        game: 'anagram'
                    });
                    
                    const gameData = createTestGameAsync({
                        GameTypeEnum: GameTypeEnum.ANAGRAM,
                        ChannelId: TEST_CHANNEL_IDS.MAIN_CHANNEL,
                        ServerId: TEST_SERVER_IDS.MAIN_SERVER
                    });
                    
                    // 2. Act - Voer de actie uit
                    const helper = new GameFlowTestHelper();
                    const result = await helper.startGameAsync({
                        gameType: GameTypeEnum.ANAGRAM,
                        channelId: TEST_CHANNEL_IDS.MAIN_CHANNEL,
                        serverId: TEST_SERVER_IDS.MAIN_SERVER,
                        userId: TEST_USER_IDS.PLAYER1
                    });
                    
                    // 3. Assert - Controleer het resultaat
                    assertGameFlowSuccess(result, 'Game moet succesvol worden aangemaakt');
                    assertGameExists(result.game, 'Game object moet bestaan');
                    assertEqual(result.game?.GameTypeEnum, GameTypeEnum.ANAGRAM, 'Game type moet ANAGRAM zijn');
                    
                    await Logger.logTest(`Game ${result.game?.Id} succesvol aangemaakt!`);
                }
            },
            
            {
                name: 'Voorbeeld 2: Complete game flow met input simulatie',
                description: 'Toont hoe je een volledige game flow test met input simulatie',
                testFunction: async () => {
                    await Logger.logTest('[EXAMPLE] Test 2: Complete game flow');
                    
                    // 1. Stel input simulator op
                    const inputSimulator = TestInputSimulator.create()
                        .expectConfirmation(true)           // Bevestig game start
                        .expectInput('cats')                // Eerste antwoord
                        .expectInput('wrong_answer')        // Fout antwoord
                        .expectInput('star')                // Correct antwoord
                        .expectButton('continue')           // Ga verder button
                        .expectInput('listen');             // Laatste antwoord
                    
                    // 2. Configureer game flow test
                    const helper = new GameFlowTestHelper();
                    const gameConfig = {
                        gameType: GameTypeEnum.ANAGRAM,
                        channelId: TEST_CHANNEL_IDS.GAME_CHANNEL,
                        serverId: TEST_SERVER_IDS.MAIN_SERVER,
                        userId: TEST_USER_IDS.PLAYER1,
                        expectedAnswers: ['cats', 'wrong_answer', 'star', 'listen'],
                        settings: {
                            difficulty: 'medium',
                            timeLimit: 60,
                            hints: true
                        },
                        inputSimulator
                    };
                    
                    // 3. Voer complete flow uit
                    const result = await helper.completeGameFlowAsync(gameConfig);
                    
                    // 4. Valideer resultaten
                    assertGameFlowSuccess(result, 'Complete game flow moet slagen');
                    assertNotNull(result.finalAnswer, 'Game moet een final answer hebben');
                    assertGreaterThan(result.messages.length, 0, 'Er moeten berichten zijn verstuurd');
                    assertGreaterThan(result.timeline.length, 0, 'Er moet timeline history zijn');
                    
                    await Logger.logTest(`Complete flow succesvol: ${result.messages.length} berichten, ${result.timeline.length} timeline entries`);
                }
            },
            
            {
                name: 'Voorbeeld 3: Database transactie test',
                description: 'Toont hoe database transacties en rollback werken',
                testFunction: async () => {
                    await Logger.logTest('Test 3: Database transactie');
                    
                    // 1. Test data voorbereiden
                    const testData = [
                        {
                            ServerId: 'transaction_test_server',
                            LanguageEnum: LanguageEnum.NL,
                            Points: 100
                        }
                    ];
                    
                    // 2. Insert test data (wordt automatisch gerollback na test)
                    await TestDatabase.getInstance().insertAsync(TableEnum.SERVERS, testData[0]);
                    await Logger.logTest('Test data inserted');
                    
                    // 3. Verifieer dat data bestaat
                    const query = "SELECT * FROM servers WHERE ServerId = ?";
                    const results = await TestDatabase.getInstance().runQueryAsync(query, ['transaction_test_server']);
                    
                    assertEqual(results.length, 1, 'Test server moet bestaan');
                    assertEqual(results[0].Points, 100, 'Server moet 100 punten hebben');
                    
                    await Logger.logTest('Database test data geverifieerd');
                    // Na deze test wordt alle data automatisch gerollback!
                }
            },
            
            {
                name: 'Voorbeeld 4: Error handling test',
                description: 'Toont hoe je errors en edge cases test',
                testFunction: async () => {
                    await Logger.logTest('Test 4: Error handling');
                    
                    // 1. Test invalid game type
                    const helper = new GameFlowTestHelper();
                    
                    let errorCaught = false;
                    try {
                        await helper.startGameAsync({
                            gameType: 999 as GameTypeEnum, // Invalid game type
                            channelId: TEST_CHANNEL_IDS.MAIN_CHANNEL,
                            serverId: TEST_SERVER_IDS.MAIN_SERVER,
                            userId: TEST_USER_IDS.PLAYER1
                        });
                    } catch (error) {
                        errorCaught = true;
                        await Logger.logTest(`Expected error caught: ${(error as Error).message}`);
                    }
                    
                    assertEqual(errorCaught, true, 'Invalid game type moet een error gooien');
                    
                    // 2. Test duplicate game in channel
                    const validConfig = {
                        gameType: GameTypeEnum.ANAGRAM,
                        channelId: TEST_CHANNEL_IDS.MAIN_CHANNEL,
                        serverId: TEST_SERVER_IDS.MAIN_SERVER,
                        userId: TEST_USER_IDS.PLAYER1
                    };
                    
                    // Eerste game aanmaken
                    const result1 = await helper.startGameAsync(validConfig);
                    assertGameFlowSuccess(result1, 'Eerste game moet slagen');
                    
                    // Tweede game in zelfde channel (should handle gracefully)
                    const helper2 = new GameFlowTestHelper();
                    const result2 = await helper2.startGameAsync(validConfig);
                    
                    // Afhankelijk van business logic, kan dit slagen of falen
                    await Logger.logTest(`Duplicate game result: ${result2.success ? 'Success' : 'Failed'}`);
                }
            },
            
            {
                name: 'Voorbeeld 5: Performance en concurrency test',
                description: 'Toont hoe je performance en gelijktijdige operaties test',
                testFunction: async () => {
                    await Logger.logTest('Test 5: Performance test');
                    
                    const startTime = Date.now();
                    const promises = [];
                    
                    // Start meerdere games tegelijkertijd
                    for (let i = 0; i < 5; i++) {
                        const helper = new GameFlowTestHelper();
                        const config = {
                            gameType: GameTypeEnum.ANAGRAM,
                            channelId: `performance_channel_${i}`,
                            serverId: TEST_SERVER_IDS.MAIN_SERVER,
                            userId: `performance_user_${i}`
                        };
                        
                        promises.push(helper.startGameAsync(config));
                    }
                    
                    const results = await Promise.allSettled(promises);
                    const duration = Date.now() - startTime;
                    
                    const successCount = results.filter(r => r.status === 'fulfilled').length;
                    await Logger.logTest(`${successCount}/5 games created in ${duration}ms`);
                    
                    assertGreaterThan(successCount, 0, 'Minstens één game moet succesvol zijn');
                    // Performance assertion: should complete within reasonable time
                    // assertLessThan(duration, 5000, 'Should complete within 5 seconds');
                }
            }
        ]
    };
    
    runner.addSuite(suite);
}

/**
 * Standalone voorbeeld functie voor individuele test
 */
export async function runStandaloneExample(): Promise<void> {
    await Logger.logTest('🧪 Standalone test voorbeeld');
    
    try {
        // Setup
        await DatabaseTestHelper.setupForTestAsync();
        await DatabaseTestHelper.startTestCaseAsync();
        
        // Test
        const eventBuilder = TestDiscordEventBuilder.create()
            .withUser({ id: 'standalone_user', username: 'StandaloneTest' });
        
        const event = eventBuilder.buildSlashCommandEvent(CommandEnum.GAMES);
        await Logger.logTest('✅ Standalone test succesvol');
        
        // Cleanup
        await DatabaseTestHelper.endTestCaseAsync();
        await DatabaseTestHelper.teardownAsync();
        
    } catch (error) {
        await Logger.logError('❌ Standalone test failed:', error as Error);
        await DatabaseTestHelper.teardownAsync();
    }
}

// Voor directe uitvoering van dit bestand
if (require.main === module) {
    runStandaloneExample();
}