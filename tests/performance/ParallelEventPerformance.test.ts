import { EventTypeEnum } from '../../src/interfaces/enums';
import { PerformanceTestHelper } from '../helpers/PerformanceTestHelper';
import { PERFORMANCE_BASELINES } from '../config/PerformanceBaselines';
import AssertionHelpers from '../helpers/AssertionHelpers';
import TestRunner from '../TestRunner';
import { PerformanceTestSuite } from '../interfaces/PerformanceTestInterface';

export default function registerParallelEventPerformanceTests(runner: TestRunner): void {
    const suite: PerformanceTestSuite = {
        name: 'Parallel Event Performance',
        description: 'Performance tests for parallel event processing',

        setup: async () => {
            // Setup any test data if needed
        },

        teardown: async () => {
            // Cleanup any persistent test data
        },

        tests: [
            {
                name: 'parallel_message_events_10',
                description: 'Test performance of 10 parallel message events',
                config: {
                    eventCount: 10,
                    concurrency: 5,
                    eventTypes: [EventTypeEnum.MESSAGE],
                    testScenario: 'parallel'
                },
                testFunction: async () => {
                    const helper = new PerformanceTestHelper();
                    const result = await helper.runParallelEventTest({
                        eventCount: 10,
                        concurrency: 5,
                        eventTypes: [EventTypeEnum.MESSAGE],
                        testScenario: 'parallel'
                    });

                    AssertionHelpers.assertTrue(result.success, 'Parallel message events test should succeed');
                    AssertionHelpers.assertPerformanceWithinBaseline(
                        result.metrics, 
                        PERFORMANCE_BASELINES.PARALLEL_EVENTS,
                        'Parallel message events performance should be within baseline'
                    );
                    AssertionHelpers.assertNoMemoryLeaks(result.metrics, 'No memory leaks should occur');
                    helper.logPerformance(result);
                }
            },

            {
                name: 'parallel_mixed_events_50',
                description: 'Test performance of 50 parallel mixed events',
                config: {
                    eventCount: 50,
                    concurrency: 10,
                    eventTypes: [EventTypeEnum.MESSAGE, EventTypeEnum.SLASH_COMMAND, EventTypeEnum.BUTTON],
                    testScenario: 'parallel'
                },
                testFunction: async () => {
                    const helper = new PerformanceTestHelper();
                    const result = await helper.runParallelEventTest({
                        eventCount: 50,
                        concurrency: 10,
                        eventTypes: [EventTypeEnum.MESSAGE, EventTypeEnum.SLASH_COMMAND, EventTypeEnum.BUTTON],
                        testScenario: 'parallel'
                    });

                    AssertionHelpers.assertTrue(result.success, 'Parallel mixed events test should succeed');
                    AssertionHelpers.assertPerformanceWithinBaseline(
                        result.metrics, 
                        PERFORMANCE_BASELINES.PARALLEL_EVENTS,
                        'Parallel mixed events performance should be within baseline'
                    );
                    helper.logPerformance(result);
                }
            },

            {
                name: 'parallel_slash_commands_25',
                description: 'Test performance of 25 parallel slash command events',
                config: {
                    eventCount: 25,
                    concurrency: 8,
                    eventTypes: [EventTypeEnum.SLASH_COMMAND],
                    testScenario: 'parallel'
                },
                testFunction: async () => {
                    const helper = new PerformanceTestHelper();
                    const result = await helper.runParallelEventTest({
                        eventCount: 25,
                        concurrency: 8,
                        eventTypes: [EventTypeEnum.SLASH_COMMAND],
                        testScenario: 'parallel'
                    });

                    AssertionHelpers.assertTrue(result.success, 'Parallel slash commands test should succeed');
                    AssertionHelpers.assertPerformanceWithinBaseline(
                        result.metrics, 
                        PERFORMANCE_BASELINES.PARALLEL_EVENTS,
                        'Parallel slash commands performance should be within baseline'
                    );
                    helper.logPerformance(result);
                }
            },

            {
                name: 'parallel_button_events_30',
                description: 'Test performance of 30 parallel button events',
                config: {
                    eventCount: 30,
                    concurrency: 6,
                    eventTypes: [EventTypeEnum.BUTTON],
                    testScenario: 'parallel'
                },
                testFunction: async () => {
                    const helper = new PerformanceTestHelper();
                    const result = await helper.runParallelEventTest({
                        eventCount: 30,
                        concurrency: 6,
                        eventTypes: [EventTypeEnum.BUTTON],
                        testScenario: 'parallel'
                    });

                    AssertionHelpers.assertTrue(result.success, 'Parallel button events test should succeed');
                    AssertionHelpers.assertPerformanceWithinBaseline(
                        result.metrics, 
                        PERFORMANCE_BASELINES.PARALLEL_EVENTS,
                        'Parallel button events performance should be within baseline'
                    );
                    helper.logPerformance(result);
                }
            }
        ]
    };

    runner.addSuite(suite);
}
