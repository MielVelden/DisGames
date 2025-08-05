# DisGames Test Module

## Overzicht

De testmodule voor DisGames biedt een complete testinfrastructuur voor het testen van Discord bot functionaliteit zonder productiedata te beïnvloeden.

## Kernfunctionaliteiten

### 🎭 Mock Discord Events
- Volledige Discord event simulatie
- Gebruikers-, server- en kanaalinteracties
- Geen echte Discord API calls

### 🗄️ Database Isolatie
- Elke test draait in eigen transactie
- Automatische rollback na elke test
- Test data blijft gescheiden van productie

### 🎮 Game Flow Testing
- Complete game flows testen
- Input simulatie en validatie
- Timeline en message tracking

### 📊 Test Runner
- Automatische test discovery
- Parallelle uitvoering
- Gedetailleerde rapportage

## Quick Start

```bash
# Alle tests draaien
npm test

# Alleen unit tests
npm run test:unit

# Alleen integration tests
npm run test:integration
```

## Test Structuur

```
tests/
├── interfaces/          # Test-specifieke interfaces
├── data/                # Stamdata voor tests
├── builders/            # Mock builders (Discord events, input)
├── helpers/             # Test utilities en assertions
├── config/              # Test configuratie en database
├── unit/               # Unit tests
├── integration/        # Integration tests
└── examples/           # Voorbeeld tests
```

## Stamdata Gebruik

```typescript
import { TEST_USERS, TEST_SERVERS, getTestUser } from './data/stubData';

// Gebruik predefined test data
const testUser = getTestUser('PLAYER1');
const testServer = TEST_SERVERS.MAIN;
```

## Database Testing

Alle tests draaien automatisch in transacties die worden teruggedraaid:

```typescript
// Test setup gebeurt automatisch
await DatabaseTestHelper.insertTestData(TableEnum.SERVERS, [testServer]);

// Test logic hier
const result = await GameService.saveAsync(gameData, event);

// Cleanup gebeurt automatisch via rollback
```

## Mock Discord Events

```typescript
const builder = TestDiscordEventBuilder.create()
    .withUser(testUser)
    .withServer(testServer)
    .withChannel(testChannel);

const event = builder.buildSlashCommandEvent('games', { game: 'anagram' });
```

## Assertions

```typescript
import AssertionHelpers from './helpers/AssertionHelpers';

AssertionHelpers.assertEqual(actual, expected, 'Values should match');
AssertionHelpers.assertGameExists(game, 'Game should exist');
AssertionHelpers.assertGreaterThan(count, 0, 'Should have results');
```

## Environment Setup

Maak een `.env.test` bestand:

```env
DATABASE_URL=mysql://user:pass@localhost:3306/test_db
TEST_ROLLBACK=true
TEST_LOG_LEVEL=info
```

## Best Practices

1. **Gebruik stamdata** uit `data/stubData.ts`
2. **Test isolatie** - elke test is onafhankelijk
3. **Geen side effects** - alle wijzigingen worden teruggedraaid
4. **Type safety** - vermijd `any` casts
5. **Enum gebruik** - gebruik TableEnum voor database operaties

Voor meer details zie `DEV_GUIDE.md`.