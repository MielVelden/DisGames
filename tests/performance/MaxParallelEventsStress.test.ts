import { EventTypeEnum } from '../../src/interfaces/enums';
import { PerformanceTestHelper } from '../helpers/PerformanceTestHelper';
import AssertionHelpers from '../helpers/AssertionHelpers';
import TestRunner from '../TestRunner';
import { PerformanceTestSuite } from '../interfaces/PerformanceTestInterface';
import Logger from '../../src/utils/application/Logger';

interface StressTestResult {
    maxEventsPerSecond: number;
    maxConcurrency: number;
    breakingPoint: number;
    optimalConcurrency: number;
    optimalThroughput: number;
    results: Array<{
        concurrency: number;
        eventsPerSecond: number;
        averageResponseTime: number;
        errorRate: number;
        success: boolean;
    }>;
}

export default function registerMaxParallelEventsStressTests(runner: TestRunner): void {
    const suite: PerformanceTestSuite = {
        name: 'Maximum Parallel Events Stress Test',
        description: 'Stress test to find the maximum parallel events per second the system can handle',

        setup: async () => {
            Logger.logTest('🚀 Setting up stress test environment...');
        },

        teardown: async () => {
            Logger.logTest('🧹 Cleaning up stress test environment...');
        },

        tests: [
            {
                name: 'find_max_parallel_events_per_second',
                description: 'Find the maximum parallel events per second by gradually increasing load',
                config: {
                    eventCount: 1000,
                    concurrency: 1,
                    eventTypes: [EventTypeEnum.MESSAGE],
                    testScenario: 'stress'
                },
                testFunction: async () => {
                    const helper = new PerformanceTestHelper();
                    const stressResult = await runStressTest(helper);
                    
                    Logger.logTest('📊 Stress Test Results:');
                    Logger.logTest(`🎯 Maximum Events Per Second: ${stressResult.maxEventsPerSecond}`);
                    Logger.logTest(`⚡ Optimal Concurrency: ${stressResult.optimalConcurrency}`);
                    Logger.logTest(`💥 Breaking Point: ${stressResult.breakingPoint}`);
                    Logger.logTest(`📈 Optimal Throughput: ${stressResult.optimalThroughput} events/sec`);
                    
                    // Log detailed results
                    Logger.logTest('\n📋 Detailed Results:');
                    stressResult.results.forEach((result, index) => {
                        const status = result.success ? '✅' : '❌';
                        Logger.logTest(`${status} Concurrency ${result.concurrency}: ${result.eventsPerSecond.toFixed(2)} events/sec, ${result.averageResponseTime.toFixed(2)}ms avg response, ${(result.errorRate * 100).toFixed(1)}% errors`);
                    });

                    AssertionHelpers.assertTrue(stressResult.maxEventsPerSecond > 0, 'Should find a maximum events per second');
                    AssertionHelpers.assertTrue(stressResult.optimalConcurrency > 0, 'Should find an optimal concurrency level');
                }
            },

            {
                name: 'stress_test_mixed_events',
                description: 'Stress test with mixed event types to find realistic maximum',
                config: {
                    eventCount: 2000,
                    concurrency: 1,
                    eventTypes: [EventTypeEnum.MESSAGE, EventTypeEnum.SLASH_COMMAND, EventTypeEnum.BUTTON],
                    testScenario: 'stress_mixed'
                },
                testFunction: async () => {
                    const helper = new PerformanceTestHelper();
                    const stressResult = await runMixedEventStressTest(helper);
                    
                    Logger.logTest('📊 Mixed Event Stress Test Results:');
                    Logger.logTest(`🎯 Maximum Events Per Second: ${stressResult.maxEventsPerSecond}`);
                    Logger.logTest(`⚡ Optimal Concurrency: ${stressResult.optimalConcurrency}`);
                    Logger.logTest(`💥 Breaking Point: ${stressResult.breakingPoint}`);
                    
                    AssertionHelpers.assertTrue(stressResult.maxEventsPerSecond > 0, 'Should find a maximum events per second for mixed events');
                }
            },

            {
                name: 'burst_load_test',
                description: 'Test system behavior under burst load conditions',
                config: {
                    eventCount: 5000,
                    concurrency: 1,
                    eventTypes: [EventTypeEnum.MESSAGE],
                    testScenario: 'burst'
                },
                testFunction: async () => {
                    const helper = new PerformanceTestHelper();
                    const burstResult = await runBurstLoadTest(helper);
                    
                    Logger.logTest('📊 Burst Load Test Results:');
                    Logger.logTest(`🎯 Peak Events Per Second: ${burstResult.peakEventsPerSecond}`);
                    Logger.logTest(`⚡ Sustained Events Per Second: ${burstResult.sustainedEventsPerSecond}`);
                    Logger.logTest(`📉 Recovery Time: ${burstResult.recoveryTime}ms`);
                    
                    AssertionHelpers.assertTrue(burstResult.peakEventsPerSecond > 0, 'Should handle burst load');
                }
            }
        ]
    };

    runner.addSuite(suite);
}

async function runStressTest(helper: PerformanceTestHelper): Promise<StressTestResult> {
    const results: StressTestResult['results'] = [];
    let maxEventsPerSecond = 0;
    let maxConcurrency = 0;
    let breakingPoint = 0;
    let optimalConcurrency = 0;
    let optimalThroughput = 0;
    
    // Start with low concurrency and gradually increase
    const concurrencyLevels = [10, 20, 25, 30, 40, 50, 75, 100, 150, 200, 300, 500];
    
    for (const concurrency of concurrencyLevels) {
        Logger.logTest(`🔄 Testing concurrency level: ${concurrency}`);
        
        try {
            const result = await helper.runLoadTest({
                eventCount: 1000,
                concurrency: concurrency,
                warmupEvents: Math.min(50, concurrency),
                eventTypes: [EventTypeEnum.MESSAGE],
                testScenario: 'parallel'
            });

            const eventsPerSecond = result.metrics.throughput;
            const success = result.success && result.metrics.errorRate < 0.5; // Allow up to 50% errors in stress test
            
            results.push({
                concurrency,
                eventsPerSecond,
                averageResponseTime: result.metrics.averageResponseTime,
                errorRate: result.metrics.errorRate,
                success
            });

            if (success && eventsPerSecond > maxEventsPerSecond) {
                maxEventsPerSecond = eventsPerSecond;
                maxConcurrency = concurrency;
                optimalConcurrency = concurrency;
                optimalThroughput = eventsPerSecond;
            }

            // If we're getting too many errors or response times are too high, we've hit the breaking point
            if (!success || result.metrics.averageResponseTime > 2000 || result.metrics.errorRate > 0.3) {
                if (breakingPoint === 0) {
                    breakingPoint = concurrency;
                }
                Logger.logTest(`⚠️ Breaking point detected at concurrency ${concurrency}`);
                break;
            }

            Logger.logTest(`✅ Concurrency ${concurrency}: ${eventsPerSecond.toFixed(2)} events/sec, ${result.metrics.averageResponseTime.toFixed(2)}ms avg response`);
            
        } catch (error) {
            Logger.logTest(`❌ Concurrency ${concurrency} failed: ${(error as Error).message}`);
            if (breakingPoint === 0) {
                breakingPoint = concurrency;
            }
            break;
        }
    }

    return {
        maxEventsPerSecond,
        maxConcurrency,
        breakingPoint,
        optimalConcurrency,
        optimalThroughput,
        results
    };
}

async function runMixedEventStressTest(helper: PerformanceTestHelper): Promise<StressTestResult> {
    const results: StressTestResult['results'] = [];
    let maxEventsPerSecond = 0;
    let maxConcurrency = 0;
    let breakingPoint = 0;
    let optimalConcurrency = 0;
    let optimalThroughput = 0;
    
    // More conservative concurrency levels for mixed events
    const concurrencyLevels = [1, 2, 5, 10, 15, 20, 25, 30, 40, 50, 75, 100];
    
    for (const concurrency of concurrencyLevels) {
        Logger.logTest(`🔄 Testing mixed events concurrency level: ${concurrency}`);
        
        try {
            const result = await helper.runLoadTest({
                eventCount: 2000,
                concurrency: concurrency,
                warmupEvents: Math.min(100, concurrency * 2),
                eventTypes: [EventTypeEnum.MESSAGE, EventTypeEnum.SLASH_COMMAND, EventTypeEnum.BUTTON],
                testScenario: 'mixed'
            });

            const eventsPerSecond = result.metrics.throughput;
            const success = result.success && result.metrics.errorRate < 0.4; // Allow up to 40% errors for mixed events
            
            results.push({
                concurrency,
                eventsPerSecond,
                averageResponseTime: result.metrics.averageResponseTime,
                errorRate: result.metrics.errorRate,
                success
            });

            if (success && eventsPerSecond > maxEventsPerSecond) {
                maxEventsPerSecond = eventsPerSecond;
                maxConcurrency = concurrency;
                optimalConcurrency = concurrency;
                optimalThroughput = eventsPerSecond;
            }

            // More lenient breaking point for mixed events
            if (!success || result.metrics.averageResponseTime > 3000 || result.metrics.errorRate > 0.4) {
                if (breakingPoint === 0) {
                    breakingPoint = concurrency;
                }
                Logger.logTest(`⚠️ Breaking point detected at concurrency ${concurrency}`);
                break;
            }

            Logger.logTest(`✅ Mixed Concurrency ${concurrency}: ${eventsPerSecond.toFixed(2)} events/sec, ${result.metrics.averageResponseTime.toFixed(2)}ms avg response`);
            
        } catch (error) {
            Logger.logTest(`❌ Mixed Concurrency ${concurrency} failed: ${(error as Error).message}`);
            if (breakingPoint === 0) {
                breakingPoint = concurrency;
            }
            break;
        }
    }

    return {
        maxEventsPerSecond,
        maxConcurrency,
        breakingPoint,
        optimalConcurrency,
        optimalThroughput,
        results
    };
}

async function runBurstLoadTest(helper: PerformanceTestHelper): Promise<{
    peakEventsPerSecond: number;
    sustainedEventsPerSecond: number;
    recoveryTime: number;
}> {
    Logger.logTest('🚀 Running burst load test...');
    
    // Test with high concurrency for burst conditions
    const burstConcurrency = 200;
    const burstEventCount = 5000;
    
    const startTime = Date.now();
    const result = await helper.runLoadTest({
        eventCount: burstEventCount,
        concurrency: burstConcurrency,
        warmupEvents: 200,
        eventTypes: [EventTypeEnum.MESSAGE],
        testScenario: 'parallel'
    });
    const endTime = Date.now();
    
    const peakEventsPerSecond = result.metrics.throughput;
    const sustainedEventsPerSecond = (burstEventCount * 1000) / (endTime - startTime);
    const recoveryTime = endTime - startTime;
    
    Logger.logTest(`📊 Burst Test: Peak ${peakEventsPerSecond.toFixed(2)} events/sec, Sustained ${sustainedEventsPerSecond.toFixed(2)} events/sec`);
    
    return {
        peakEventsPerSecond,
        sustainedEventsPerSecond,
        recoveryTime
    };
}
