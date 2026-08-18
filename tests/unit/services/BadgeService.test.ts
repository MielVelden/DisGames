import TestRunner from '../../TestRunner';
import { TestSuite } from '../../interfaces/TestRunnerInterface';
import { BadgeContext } from '../../../src/interfaces/domain/Badge';
import { BadgeEnum, BadgeTriggerEnum } from '../../../src/interfaces/enums';
import AssertionHelpers from '../../helpers/AssertionHelpers';

import GamesPlayed from '../../../src/services/badges/Games_Played';
import PointCollector from '../../../src/services/badges/Point_Collector';
import Veteran from '../../../src/services/badges/Veteran';
import WorldTraveler from '../../../src/services/badges/World_Traveler';

function makeContext(overrides: Partial<{
    gamesPlayed: number;
    totalPoints: number;
    accountAgeDays: number;
    distinctServers: number;
    streakDays: number;
}>): BadgeContext {
    return {
        userId: 'test-user',
        guildId: 'test-guild',
        trigger: BadgeTriggerEnum.AFTER_GAME,
        streakDays: async () => overrides.streakDays ?? 0,
        totalPoints: async () => overrides.totalPoints ?? 0,
        gamesPlayed: async () => overrides.gamesPlayed ?? 0,
        accountAgeDays: async () => overrides.accountAgeDays ?? 0,
        distinctServers: async () => overrides.distinctServers ?? 0,
    };
}

export default function registerBadgeServiceTests(runner: TestRunner): void {
    const suite: TestSuite = {
        name: 'BadgeService',
        description: 'Unit tests for badge evaluate() logic',

        tests: [
            // ── Games Played ──────────────────────────────────────────────
            {
                name: 'GamesPlayed: returns null below threshold',
                testFunction: async () => {
                    const result = await GamesPlayed.evaluate(makeContext({ gamesPlayed: 9 }));
                    AssertionHelpers.assertNull(result, 'Should not earn badge below 10 games');
                },
            },
            {
                name: 'GamesPlayed: earns level 1 at exactly 10 games',
                testFunction: async () => {
                    const result = await GamesPlayed.evaluate(makeContext({ gamesPlayed: 10 }));
                    AssertionHelpers.assertEqual(result, 1, 'Should earn level 1 at 10 games');
                },
            },
            {
                name: 'GamesPlayed: earns level 2 at exactly 50 games',
                testFunction: async () => {
                    const result = await GamesPlayed.evaluate(makeContext({ gamesPlayed: 50 }));
                    AssertionHelpers.assertEqual(result, 2, 'Should earn level 2 at 50 games');
                },
            },
            {
                name: 'GamesPlayed: earns level 3 at exactly 250 games',
                testFunction: async () => {
                    const result = await GamesPlayed.evaluate(makeContext({ gamesPlayed: 250 }));
                    AssertionHelpers.assertEqual(result, 3, 'Should earn level 3 at 250 games');
                },
            },
            {
                name: 'GamesPlayed: stays at level 3 above 250 games',
                testFunction: async () => {
                    const result = await GamesPlayed.evaluate(makeContext({ gamesPlayed: 1000 }));
                    AssertionHelpers.assertEqual(result, 3, 'Should stay at level 3 above 250 games');
                },
            },
            {
                name: 'GamesPlayed: config is correct',
                testFunction: async () => {
                    AssertionHelpers.assertEqual(GamesPlayed.config.id, BadgeEnum.GAMES_PLAYED, 'Badge id should be GAMES_PLAYED');
                    AssertionHelpers.assertTrue(GamesPlayed.config.triggers.includes(BadgeTriggerEnum.AFTER_GAME), 'Should trigger AFTER_GAME');
                },
            },

            // ── Point Collector ───────────────────────────────────────────
            {
                name: 'PointCollector: returns null below threshold',
                testFunction: async () => {
                    const result = await PointCollector.evaluate(makeContext({ totalPoints: 499 }));
                    AssertionHelpers.assertNull(result, 'Should not earn badge below 500 points');
                },
            },
            {
                name: 'PointCollector: earns level 1 at exactly 500 points',
                testFunction: async () => {
                    const result = await PointCollector.evaluate(makeContext({ totalPoints: 500 }));
                    AssertionHelpers.assertEqual(result, 1, 'Should earn level 1 at 500 points');
                },
            },
            {
                name: 'PointCollector: earns level 2 at exactly 5000 points',
                testFunction: async () => {
                    const result = await PointCollector.evaluate(makeContext({ totalPoints: 5_000 }));
                    AssertionHelpers.assertEqual(result, 2, 'Should earn level 2 at 5000 points');
                },
            },
            {
                name: 'PointCollector: earns level 3 at exactly 50000 points',
                testFunction: async () => {
                    const result = await PointCollector.evaluate(makeContext({ totalPoints: 50_000 }));
                    AssertionHelpers.assertEqual(result, 3, 'Should earn level 3 at 50000 points');
                },
            },
            {
                name: 'PointCollector: level 1 does not bleed into level 2 range',
                testFunction: async () => {
                    const result = await PointCollector.evaluate(makeContext({ totalPoints: 4_999 }));
                    AssertionHelpers.assertEqual(result, 1, 'Should still be level 1 at 4999 points');
                },
            },
            {
                name: 'PointCollector: config is correct',
                testFunction: async () => {
                    AssertionHelpers.assertEqual(PointCollector.config.id, BadgeEnum.POINT_COLLECTOR, 'Badge id should be POINT_COLLECTOR');
                    AssertionHelpers.assertTrue(PointCollector.config.triggers.includes(BadgeTriggerEnum.AFTER_GAME), 'Should trigger AFTER_GAME');
                },
            },

            // ── Veteran ───────────────────────────────────────────────────
            {
                name: 'Veteran: returns null below 100 days',
                testFunction: async () => {
                    const result = await Veteran.evaluate(makeContext({ accountAgeDays: 99 }));
                    AssertionHelpers.assertNull(result, 'Should not earn badge below 100 days');
                },
            },
            {
                name: 'Veteran: earns level 1 at exactly 100 days',
                testFunction: async () => {
                    const result = await Veteran.evaluate(makeContext({ accountAgeDays: 100 }));
                    AssertionHelpers.assertEqual(result, 1, 'Should earn level 1 at 100 days');
                },
            },
            {
                name: 'Veteran: earns level 2 at exactly 200 days',
                testFunction: async () => {
                    const result = await Veteran.evaluate(makeContext({ accountAgeDays: 200 }));
                    AssertionHelpers.assertEqual(result, 2, 'Should earn level 2 at 200 days');
                },
            },
            {
                name: 'Veteran: earns level 3 at exactly 500 days',
                testFunction: async () => {
                    const result = await Veteran.evaluate(makeContext({ accountAgeDays: 500 }));
                    AssertionHelpers.assertEqual(result, 3, 'Should earn level 3 at 500 days');
                },
            },
            {
                name: 'Veteran: level 1 does not bleed into level 2 range',
                testFunction: async () => {
                    const result = await Veteran.evaluate(makeContext({ accountAgeDays: 199 }));
                    AssertionHelpers.assertEqual(result, 1, 'Should still be level 1 at 199 days');
                },
            },
            {
                name: 'Veteran: config is correct',
                testFunction: async () => {
                    AssertionHelpers.assertEqual(Veteran.config.id, BadgeEnum.VETERAN, 'Badge id should be VETERAN');
                    AssertionHelpers.assertTrue(Veteran.config.triggers.includes(BadgeTriggerEnum.AFTER_GAME), 'Should trigger AFTER_GAME');
                },
            },

            // ── World Traveler ────────────────────────────────────────────
            {
                name: 'WorldTraveler: returns null below 5 servers',
                testFunction: async () => {
                    const result = await WorldTraveler.evaluate(makeContext({ distinctServers: 4 }));
                    AssertionHelpers.assertNull(result, 'Should not earn badge below 5 servers');
                },
            },
            {
                name: 'WorldTraveler: earns level 1 at exactly 5 servers',
                testFunction: async () => {
                    const result = await WorldTraveler.evaluate(makeContext({ distinctServers: 5 }));
                    AssertionHelpers.assertEqual(result, 1, 'Should earn level 1 at 5 servers');
                },
            },
            {
                name: 'WorldTraveler: earns level 2 at exactly 10 servers',
                testFunction: async () => {
                    const result = await WorldTraveler.evaluate(makeContext({ distinctServers: 10 }));
                    AssertionHelpers.assertEqual(result, 2, 'Should earn level 2 at 10 servers');
                },
            },
            {
                name: 'WorldTraveler: earns level 3 at exactly 20 servers',
                testFunction: async () => {
                    const result = await WorldTraveler.evaluate(makeContext({ distinctServers: 20 }));
                    AssertionHelpers.assertEqual(result, 3, 'Should earn level 3 at 20 servers');
                },
            },
            {
                name: 'WorldTraveler: level 1 does not bleed into level 2 range',
                testFunction: async () => {
                    const result = await WorldTraveler.evaluate(makeContext({ distinctServers: 9 }));
                    AssertionHelpers.assertEqual(result, 1, 'Should still be level 1 at 9 servers');
                },
            },
            {
                name: 'WorldTraveler: config is correct',
                testFunction: async () => {
                    AssertionHelpers.assertEqual(WorldTraveler.config.id, BadgeEnum.WORLD_TRAVELER, 'Badge id should be WORLD_TRAVELER');
                    AssertionHelpers.assertTrue(WorldTraveler.config.triggers.includes(BadgeTriggerEnum.AFTER_GAME), 'Should trigger AFTER_GAME');
                },
            },

            // ── Context isolation ─────────────────────────────────────────
            {
                name: 'badges only read their own stat from context',
                testFunction: async () => {
                    // A context where every stat except gamesPlayed is maxed out.
                    // GamesPlayed badge should still return null because gamesPlayed is 0.
                    const ctx = makeContext({ gamesPlayed: 0, totalPoints: 999_999, accountAgeDays: 999, distinctServers: 99 });
                    const result = await GamesPlayed.evaluate(ctx);
                    AssertionHelpers.assertNull(result, 'GamesPlayed badge should not be influenced by other stats');
                },
            },
        ],
    };

    runner.addSuite(suite);
}
