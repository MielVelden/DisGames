import TestRunner from '../../../TestRunner';
import { TestSuite } from '../../../interfaces/TestRunnerInterface';
import Connections from '../../../../src/services/games/Connections';
import { LanguageEnum } from '../../../../src/interfaces/enums/database/LanguageEnum';
import AssertionHelpers from '../../../helpers/AssertionHelpers';

// Connections' parseWordsFromAnswer / validateCategory helpers are module-private,
// so we exercise them via the public GameModule entry point: functions.validateAnswer.
// validateAnswer needs an event-shaped object exposing:
//   - getGameDataAnswer(): string  (the serialized game state)
//   - setGameDataAnswer(s: string): void
//   - userInput: string
//   - server.LanguageEnum: LanguageEnum

const EN = LanguageEnum.EN;

interface FakeEvent {
    getGameDataAnswer(): string;
    setGameDataAnswer(s: string): void;
    userInput: string;
    server: { LanguageEnum: LanguageEnum };
}

function makeState(categories: string[][], solved: number[] = []): string {
    return JSON.stringify({
        gameDataArray: categories.map(words => ({
            // MultiLingualString.fromJSON expects { [LanguageEnum value]: text }
            Response: { [EN]: words.join(';') },
            Message: { [EN]: '' }
        })),
        solvedCategories: solved
    });
}

function makeEvent(state: string, userInput: string): FakeEvent {
    let current = state;
    return {
        getGameDataAnswer: () => current,
        setGameDataAnswer: (s: string) => { current = s; },
        userInput,
        server: { LanguageEnum: EN }
    };
}

const CATEGORIES = [
    ['APPLE', 'BANANA', 'CHERRY', 'DATE'],
    ['RED', 'BLUE', 'GREEN', 'YELLOW'],
    ['DOG', 'CAT', 'FISH', 'BIRD'],
    ['ONE', 'TWO', 'THREE', 'FOUR']
];

export default function registerConnectionsTests(runner: TestRunner): void {
    const suite: TestSuite = {
        name: 'Connections',
        description: 'Unit tests for Connections guess parsing and category matching',

        tests: [
            {
                name: 'parses comma-separated guess and matches a category',
                testFunction: async () => {
                    const event = makeEvent(makeState(CATEGORIES), 'apple, banana, cherry, date');

                    const matched = Connections.functions.validateAnswer!(event as any);

                    AssertionHelpers.assertTrue(matched, 'Comma-separated guess should match category 0');
                }
            },

            {
                name: 'parses space-separated guess and matches a category',
                testFunction: async () => {
                    const event = makeEvent(makeState(CATEGORIES), 'apple banana cherry date');

                    const matched = Connections.functions.validateAnswer!(event as any);

                    AssertionHelpers.assertTrue(matched, 'Space-separated guess should match category 0');
                }
            },

            {
                name: 'matching is order-independent',
                testFunction: async () => {
                    const event1 = makeEvent(makeState(CATEGORIES), 'apple, banana, cherry, date');
                    const event2 = makeEvent(makeState(CATEGORIES), 'date, cherry, apple, banana');

                    AssertionHelpers.assertTrue(
                        Connections.functions.validateAnswer!(event1 as any),
                        'Forward order should match'
                    );
                    AssertionHelpers.assertTrue(
                        Connections.functions.validateAnswer!(event2 as any),
                        'Reversed order should match the same category'
                    );
                }
            },

            {
                name: 'partial match returns false',
                testFunction: async () => {
                    // mango is wrong — only 3 of 4 words belong to category 0
                    const event = makeEvent(makeState(CATEGORIES), 'apple, banana, cherry, mango');

                    const matched = Connections.functions.validateAnswer!(event as any);

                    AssertionHelpers.assertFalse(matched, '3/4 should not be treated as a solved category');
                }
            },

            {
                name: 'already-solved category cannot be solved again',
                testFunction: async () => {
                    // Category 0 is marked solved; guessing it again should not flag the game as solved
                    // (the implementation only returns true when all 4 categories are solved).
                    const event = makeEvent(makeState(CATEGORIES, [0]), 'apple, banana, cherry, date');

                    const matched = Connections.functions.validateAnswer!(event as any);

                    AssertionHelpers.assertFalse(matched, 'Re-guessing a solved category should not count as a new solve');
                }
            }
        ]
    };

    runner.addSuite(suite);
}
