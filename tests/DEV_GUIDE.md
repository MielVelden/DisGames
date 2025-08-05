# DisGames Test Module - Developer Guide

## Architectuur Overzicht

De testmodule is gebouwd rondom de volgende kernprincipes:

### 1. Interface Organisatie (`interfaces/`)

Alle test-specifieke interfaces zijn georganiseerd in aparte bestanden:

```typescript
// interfaces/UserTestInterface.ts
export interface TestUser {
    id: string;
    username: string;
    bot?: boolean;
}

// interfaces/GameFlowInterface.ts 
export interface GameFlowTestConfig {
    gameType: GameTypeEnum;
    channelId: string;
    serverId: string;
    // ...
}
```

### 2. Stamdata Systeem (`data/stubData.ts`)

Centraal gedefinieerde testdata die herbruikbaar is:

```typescript
export const TEST_USERS = {
    ADMIN: { UserId: 'test_admin_001', Username: 'TestAdmin' },
    PLAYER1: { UserId: 'test_player_001', Username: 'TestPlayer1' },
    // ...
};

// Helper functies
export function getTestUser(type: keyof typeof TEST_USERS) {
    return TEST_USERS[type];
}
```

### 3. Mock Builders (`builders/`)

#### TestDiscordEventBuilder
Simuleert Discord events zonder echte API calls:

```typescript
const builder = TestDiscordEventBuilder.create()
    .withUser({ id: 'user1', username: 'TestUser' })
    .withServer({ id: 'server1', name: 'TestServer' });

const slashEvent = builder.buildSlashCommandEvent('games');
const messageEvent = builder.buildMessageEvent('Hello world');
const buttonEvent = builder.buildButtonEvent('confirm');
```

#### TestInputSimulator
Simuleert gebruikersinput voor interactieve flows:

```typescript
const simulator = new TestInputSimulator();
simulator.queueSelectMenuResponse('option1');
simulator.queueButtonResponse('confirm');
simulator.queueConfirmation(true);

// In test
const result = await gameFlow.getUserInput();
// result === 'option1'
```

### 4. Database Helpers (`helpers/`)

#### DatabaseTestHelper
Zorgt voor database isolatie:

```typescript
// Automatische transactie setup
public static async enableTestMode(): Promise<void> {
    await TestDatabase.connectAsync();
    await TestDatabase.beginTransactionAsync();
}

// Automatische rollback
public static async disableTestMode(): Promise<void> {
    await TestDatabase.rollbackTransactionAsync();
}
```

#### TableNameMapping
Type-safe tabel referenties:

```typescript
import { TableEnum } from '../../src/interfaces/enums/database/TableEnum';

export const TABLE_NAMES = {
    [TableEnum.USERS]: 'users',
    [TableEnum.GAMES]: 'games',
    // ...
};
```

### 5. Game Flow Testing (`helpers/GameFlowTestHelper.ts`)

Complete game flows testen:

```typescript
const helper = new GameFlowTestHelper();
const result = await helper.completeGameFlowAsync({
    gameType: GameTypeEnum.ANAGRAM,
    channelId: 'test_channel',
    serverId: 'test_server',
    userId: 'test_user',
    expectedAnswers: ['cats', 'star'],
    settings: { difficulty: DifficultyEnum.MEDIUM }
});

// Validatie
AssertionHelpers.assertGameFlowSuccess(result);
AssertionHelpers.assertEqual(result.finalAnswer, 'cats');
```

## Een Nieuwe Test Schrijven

### 1. Unit Test

```typescript
// tests/unit/services/MyService.test.ts
import TestRunner, { TestSuite } from '../../TestRunner';
import AssertionHelpers from '../../helpers/AssertionHelpers';
import { getTestUser } from '../../data/stubData';

export default function registerMyServiceTests(runner: TestRunner): void {
    const suite: TestSuite = {
        name: 'MyService',
        description: 'Unit tests for MyService functionality',
        
        tests: [
            {
                name: 'should do something',
                testFunction: async () => {
                    // Arrange
                    const testUser = getTestUser('PLAYER1');
                    
                    // Act  
                    const result = await MyService.doSomething(testUser);
                    
                    // Assert
                    AssertionHelpers.assertNotNull(result);
                    AssertionHelpers.assertEqual(result.status, 'success');
                }
            }
        ]
    };
    
    runner.addSuite(suite);
}
```

### 2. Integration Test

```typescript
// tests/integration/flows/MyFlow.test.ts
import { GameFlowTestHelper } from '../../helpers/GameFlowTestHelper';
import { TEST_SERVERS, TEST_CHANNELS } from '../../data/stubData';

export default function registerMyFlowTests(runner: TestRunner): void {
    const suite: TestSuite = {
        name: 'MyFlow Integration',
        
        tests: [
            {
                name: 'should complete flow successfully', 
                testFunction: async () => {
                    // Setup input simulation
                    const inputSim = new TestInputSimulator();
                    inputSim.queueSelectMenuResponse('option1');
                    
                    // Test complete flow
                    const helper = new GameFlowTestHelper();
                    const result = await helper.completeGameFlowAsync({
                        gameType: GameTypeEnum.ANAGRAM,
                        channelId: TEST_CHANNELS.GAMES.ChannelId,
                        serverId: TEST_SERVERS.MAIN.ServerId,
                        userId: getTestUser('PLAYER1').UserId,
                        inputSimulator: inputSim
                    });
                    
                    AssertionHelpers.assertGameFlowSuccess(result);
                }
            }
        ]
    };
    
    runner.addSuite(suite);
}
```

## Debugging Tips

### 1. Logging
Gebruik `Logger.logTest()` voor test-specifieke logs:

```typescript
Logger.logTest('Starting complex operation');
Logger.logTest(`User ${user.id} processed successfully`);
```

### 2. Database State Inspection
```typescript
// Bekijk database state tijdens test
const games = await TestDatabase.runQueryAsync('SELECT * FROM games');
Logger.logTest(`Found ${games.length} games in database`);
```

### 3. Mock Event Debugging
```typescript
const event = builder.buildSlashCommandEvent('test');
Logger.logTest(`Event created with ID: ${event.messageId}`);
Logger.logTest(`Sent messages: ${JSON.stringify(event.getSentMessages())}`);
```

## Type Safety Best Practices

### 1. Vermijd Any Casts
```typescript
// ❌ Slecht
const result = (data as any).someProperty;

// ✅ Goed  
interface ExpectedData {
    someProperty: string;
}
const result = (data as ExpectedData).someProperty;
```

### 2. Gebruik Interface Extensions
```typescript
// Voor mock objects
interface MockEventWithCommand extends MockDiscordEvent {
    command?: Command;
    getOption?: (name: string) => any;
}
```

### 3. Enum Gebruik
```typescript
// ❌ Slecht
await TestDatabase.runQueryAsync('DELETE FROM users');

// ✅ Goed
const tableName = getTableName(TableEnum.USERS);
await TestDatabase.runQueryAsync(`DELETE FROM ${tableName}`);
```

## Performance Overwegingen

### 1. Database Optimalisatie
- Gebruik transacties voor snelle rollbacks
- Minimale test data setup
- Parallelle test uitvoering waar mogelijk

### 2. Mock Optimalisatie  
- Hergebruik builders waar mogelijk
- Cache stamdata objecten
- Minimale Discord event simulatie

### 3. Memory Management
- Clean up grote objecten na tests
- Vermijd memory leaks in mocks
- Reset simulators tussen tests

## Troubleshooting

### Test Fails met "Cannot read properties of undefined"
- Check of alle interfaces correct geïmporteerd zijn
- Verificeer stamdata beschikbaarheid
- Controleer mock setup

### Database Transactie Errors
- Zorg dat TestDatabase correct geconfigureerd is
- Check foreign key constraints in test data
- Verificeer .env.test setup

### Mock Event Issues
- Controleer of alle benodigde properties gezet zijn
- Verificeer input simulator setup
- Check event type matching