import { PerformanceBaselines } from '../interfaces/PerformanceTestInterface';

export const PERFORMANCE_BASELINES: PerformanceBaselines = {
    SINGLE_EVENT: {
        maxResponseTime: 500, // ms - realistic for Discord bot processing
        minThroughput: 0.5, // events/sec - conservative for single events
        maxMemoryUsage: 500, // MB - reasonable for single event processing
        maxErrorRate: 0.05 // 5% - allow some errors in test environment
    },
    PARALLEL_EVENTS: {
        maxResponseTime: 500, // ms - same as single events for parallel processing
        minThroughput: 2, // events/sec - realistic for parallel processing
        maxMemoryUsage: 500, // MB - more memory for parallel processing
        maxErrorRate: 0.1 // 10% - higher error rate for parallel processing
    },
    HIGH_LOAD: {
        maxResponseTime: 500, // ms - same as other scenarios for high load
        minThroughput: 1, // events/sec - very conservative for high load
        maxMemoryUsage: 500, // MB - reasonable memory usage for high load
        maxErrorRate: 0.2 // 20% - high error rate acceptable for load testing
    }
};

export default PERFORMANCE_BASELINES;
