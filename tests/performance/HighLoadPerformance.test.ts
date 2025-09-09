import { EventTypeEnum } from '../../src/interfaces/application/Event';
import { PerformanceTestHelper } from '../helpers/PerformanceTestHelper';
import { PERFORMANCE_BASELINES } from '../config/PerformanceBaselines';
import AssertionHelpers from '../helpers/AssertionHelpers';
import TestRunner from '../TestRunner';
import { PerformanceTestSuite } from '../interfaces/PerformanceTestInterface';

export default function registerHighLoadPerformanceTests(runner: TestRunner): void {
    const suite: PerformanceTestSuite = {
        name: 'High Load Performance',
        description: 'Performance tests for high load scenarios',

        setup: async () => {
            // Setup any test data if needed
        },

        teardown: async () => {
            // Cleanup any persistent test data
        },

        tests: [
            {
                name: 'high_load_1000_events',
                description: 'Test performance with 1000 events',
                config: {
                    eventCount: 1000,
                    concurrency: 25,
                    warmupEvents: 50,
                    eventTypes: [EventTypeEnum.MESSAGE],
                    testScenario: 'parallel'
                },
                testFunction: async () => {
                    const helper = new PerformanceTestHelper();
                    const result = await helper.runLoadTest({
                        eventCount: 1000,
                        concurrency: 25,
                        warmupEvents: 50,
                        eventTypes: [EventTypeEnum.MESSAGE],
                        testScenario: 'parallel'
                    });

                    AssertionHelpers.assertTrue(result.success, 'High load 1000 events test should succeed');
                    AssertionHelpers.assertPerformanceWithinBaseline(
                        result.metrics, 
                        PERFORMANCE_BASELINES.HIGH_LOAD,
                        'High load 1000 events performance should be within baseline'
                    );
                    AssertionHelpers.assertNoMemoryLeaks(result.metrics, 'No memory leaks should occur');
                }
            },

            {
                name: 'high_load_5000_events',
                description: 'Test performance with 5000 events',
                config: {
                    eventCount: 5000,
                    concurrency: 50,
                    warmupEvents: 100,
                    eventTypes: [EventTypeEnum.MESSAGE, EventTypeEnum.SLASH_COMMAND],
                    testScenario: 'parallel'
                },
                testFunction: async () => {
                    const helper = new PerformanceTestHelper();
                    const result = await helper.runLoadTest({
                        eventCount: 5000,
                        concurrency: 50,
                        warmupEvents: 100,
                        eventTypes: [EventTypeEnum.MESSAGE, EventTypeEnum.SLASH_COMMAND],
                        testScenario: 'parallel'
                    });

                    AssertionHelpers.assertTrue(result.success, 'High load 5000 events test should succeed');
                    AssertionHelpers.assertPerformanceWithinBaseline(
                        result.metrics, 
                        PERFORMANCE_BASELINES.HIGH_LOAD,
                        'High load 5000 events performance should be within baseline'
                    );
                    helper.logPerformance(result);
                }
            },

            {
                name: 'high_load_10000_events',
                description: 'Test performance with 10000 events',
                config: {
                    eventCount: 10000,
                    concurrency: 100,
                    warmupEvents: 200,
                    eventTypes: [EventTypeEnum.MESSAGE, EventTypeEnum.SLASH_COMMAND, EventTypeEnum.BUTTON],
                    testScenario: 'parallel'
                },
                testFunction: async () => {
                    const helper = new PerformanceTestHelper();
                    const result = await helper.runLoadTest({
                        eventCount: 10000,
                        concurrency: 100,
                        warmupEvents: 200,
                        eventTypes: [EventTypeEnum.MESSAGE, EventTypeEnum.SLASH_COMMAND, EventTypeEnum.BUTTON],
                        testScenario: 'parallel'
                    });

                    AssertionHelpers.assertTrue(result.success, 'High load 10000 events test should succeed');
                    AssertionHelpers.assertPerformanceWithinBaseline(
                        result.metrics, 
                        PERFORMANCE_BASELINES.HIGH_LOAD,
                        'High load 10000 events performance should be within baseline'
                    );
                    AssertionHelpers.assertNoMemoryLeaks(result.metrics, 'No memory leaks should occur');
                    helper.logPerformance(result);
                }
            },

            {
                name: 'high_load_mixed_events_2500',
                description: 'Test performance with 2500 mixed events',
                config: {
                    eventCount: 2500,
                    concurrency: 75,
                    warmupEvents: 75,
                    eventTypes: [EventTypeEnum.MESSAGE, EventTypeEnum.SLASH_COMMAND, EventTypeEnum.BUTTON],
                    testScenario: 'mixed'
                },
                testFunction: async () => {
                    const helper = new PerformanceTestHelper();
                    const result = await helper.runLoadTest({
                        eventCount: 2500,
                        concurrency: 75,
                        warmupEvents: 75,
                        eventTypes: [EventTypeEnum.MESSAGE, EventTypeEnum.SLASH_COMMAND, EventTypeEnum.BUTTON],
                        testScenario: 'mixed'
                    });

                    AssertionHelpers.assertTrue(result.success, 'High load mixed events test should succeed');
                    AssertionHelpers.assertPerformanceWithinBaseline(
                        result.metrics, 
                        PERFORMANCE_BASELINES.HIGH_LOAD,
                        'High load mixed events performance should be within baseline'
                    );
                    helper.logPerformance(result);
                }
            },

            {
                name: 'extreme_load_25000_events',
                description: 'Test performance with 25000 events (extreme load)',
                config: {
                    eventCount: 25000,
                    concurrency: 200,
                    warmupEvents: 500,
                    eventTypes: [EventTypeEnum.MESSAGE],
                    testScenario: 'parallel'
                },
                testFunction: async () => {
                    const helper = new PerformanceTestHelper();
                    const result = await helper.runLoadTest({
                        eventCount: 25000,
                        concurrency: 200,
                        warmupEvents: 500,
                        eventTypes: [EventTypeEnum.MESSAGE],
                        testScenario: 'parallel'
                    });

                    AssertionHelpers.assertTrue(result.success, 'Extreme load test should succeed');
                    AssertionHelpers.assertPerformanceWithinBaseline(
                        result.metrics, 
                        PERFORMANCE_BASELINES.HIGH_LOAD,
                        'Extreme load performance should be within baseline'
                    );
                    AssertionHelpers.assertNoMemoryLeaks(result.metrics, 'No memory leaks should occur');
                    helper.logPerformance(result);
                }
            }
        ]
    };

    runner.addSuite(suite);
}
