import { EventTypeEnum } from '../../src/interfaces/application/Event';
import { TestResult } from './TestRunnerInterface';

export interface PerformanceMetrics {
    totalDuration: number;
    averageResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    throughput: number; // events per second
    memoryUsage: {
        initial: number;
        peak: number;
        final: number;
    };
    errorRate: number;
    successRate: number;
}

export interface PerformanceTestConfig {
    eventCount: number;
    concurrency: number;
    warmupEvents?: number;
    testDuration?: number; // in ms
    eventTypes: EventTypeEnum[];
    testScenario: 'single' | 'parallel' | 'mixed' | 'stress' | 'stress_mixed' | 'burst';
}

export interface PerformanceTestResult extends TestResult {
    metrics: PerformanceMetrics;
    eventBreakdown: Map<EventTypeEnum, PerformanceMetrics>;
    resourceUsage: {
        cpuUsage: number;
        memoryLeaks: boolean;
        gcCycles: number;
    };
}

export interface PerformanceTestSuite {
    name: string;
    description?: string;
    setup?: () => Promise<void>;
    teardown?: () => Promise<void>;
    beforeEach?: () => Promise<void>;
    afterEach?: () => Promise<void>;
    tests: PerformanceTestCase[];
}

export interface PerformanceTestCase {
    name: string;
    description?: string;
    testFunction: () => Promise<void>;
    timeout?: number;
    skip?: boolean;
    only?: boolean;
    config: PerformanceTestConfig;
}

export interface PerformanceBaseline {
    maxResponseTime: number;
    minThroughput: number;
    maxMemoryUsage: number;
    maxErrorRate: number;
}

export interface PerformanceBaselines {
    SINGLE_EVENT: PerformanceBaseline;
    PARALLEL_EVENTS: PerformanceBaseline;
    HIGH_LOAD: PerformanceBaseline;
}
