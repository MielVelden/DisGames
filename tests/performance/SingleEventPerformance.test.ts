import { EventTypeEnum } from '../../src/interfaces/enums';
import { PerformanceTestHelper } from '../helpers/PerformanceTestHelper';
import { PERFORMANCE_BASELINES } from '../config/PerformanceBaselines';
import AssertionHelpers from '../helpers/AssertionHelpers';
import TestRunner from '../TestRunner';
import { PerformanceTestSuite } from '../interfaces/PerformanceTestInterface';

export default function registerSingleEventPerformanceTests(runner: TestRunner): void {
    const suite: PerformanceTestSuite = {
        name: 'Single Event Performance',
        description: 'Performance tests for single event processing',

        setup: async () => {
            // Setup any test data if needed
        },

        teardown: async () => {
            // Cleanup any persistent test data
        },

        tests: [
            {
                name: 'single_message_event_performance',
                description: 'Test performance of single message event processing',
                config: {
                    eventCount: 1,
                    concurrency: 1,
                    eventTypes: [EventTypeEnum.MESSAGE],
                    testScenario: 'single'
                },
                testFunction: async () => {
                    const helper = new PerformanceTestHelper();
                    const result = await helper.runSingleEventTest({
                        eventCount: 1,
                        concurrency: 1,
                        eventTypes: [EventTypeEnum.MESSAGE],
                        testScenario: 'single'
                    });

                    AssertionHelpers.assertTrue(result.success, 'Single event test should succeed');
                    AssertionHelpers.assertPerformanceWithinBaseline(
                        result.metrics, 
                        PERFORMANCE_BASELINES.SINGLE_EVENT,
                        'Single event performance should be within baseline'
                    );
                    AssertionHelpers.assertNoMemoryLeaks(result.metrics, 'No memory leaks should occur');
                    helper.logPerformance(result);
                }
            },

            {
                name: 'single_slash_command_performance',
                description: 'Test performance of single slash command event processing',
                config: {
                    eventCount: 1,
                    concurrency: 1,
                    eventTypes: [EventTypeEnum.SLASH_COMMAND],
                    testScenario: 'single'
                },
                testFunction: async () => {
                    const helper = new PerformanceTestHelper();
                    const result = await helper.runSingleEventTest({
                        eventCount: 1,
                        concurrency: 1,
                        eventTypes: [EventTypeEnum.SLASH_COMMAND],
                        testScenario: 'single'
                    });

                    AssertionHelpers.assertTrue(result.success, 'Single slash command test should succeed');
                    AssertionHelpers.assertPerformanceWithinBaseline(
                        result.metrics, 
                        PERFORMANCE_BASELINES.SINGLE_EVENT,
                        'Single slash command performance should be within baseline'
                    );
                    helper.logPerformance(result);
                }
            },

            {
                name: 'single_button_event_performance',
                description: 'Test performance of single button event processing',
                config: {
                    eventCount: 1,
                    concurrency: 1,
                    eventTypes: [EventTypeEnum.BUTTON],
                    testScenario: 'single'
                },
                testFunction: async () => {
                    const helper = new PerformanceTestHelper();
                    const result = await helper.runSingleEventTest({
                        eventCount: 1,
                        concurrency: 1,
                        eventTypes: [EventTypeEnum.BUTTON],
                        testScenario: 'single'
                    });

                    AssertionHelpers.assertTrue(result.success, 'Single button event test should succeed');
                    AssertionHelpers.assertPerformanceWithinBaseline(
                        result.metrics, 
                        PERFORMANCE_BASELINES.SINGLE_EVENT,
                        'Single button event performance should be within baseline'
                    );
                    helper.logPerformance(result);
                }
            },

            {
                name: 'single_mixed_events_performance',
                description: 'Test performance of single mixed event processing',
                config: {
                    eventCount: 1,
                    concurrency: 1,
                    eventTypes: [EventTypeEnum.MESSAGE, EventTypeEnum.SLASH_COMMAND, EventTypeEnum.BUTTON],
                    testScenario: 'single'
                },
                testFunction: async () => {
                    const helper = new PerformanceTestHelper();
                    const result = await helper.runSingleEventTest({
                        eventCount: 1,
                        concurrency: 1,
                        eventTypes: [EventTypeEnum.MESSAGE, EventTypeEnum.SLASH_COMMAND, EventTypeEnum.BUTTON],
                        testScenario: 'single'
                    });

                    AssertionHelpers.assertTrue(result.success, 'Single mixed event test should succeed');
                    AssertionHelpers.assertPerformanceWithinBaseline(
                        result.metrics, 
                        PERFORMANCE_BASELINES.SINGLE_EVENT,
                        'Single mixed event performance should be within baseline'
                    );
                    helper.logPerformance(result);
                }
            }
        ]
    };

    runner.addSuite(suite);
}
