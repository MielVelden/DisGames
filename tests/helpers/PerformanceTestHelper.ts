import { InteractionEvent } from '../../src/interfaces/application/Event';
import { EventTypeEnum } from '../../src/interfaces/enums';
import { PerformanceTestConfig, PerformanceTestResult, PerformanceMetrics, PerformanceBaseline } from '../interfaces/PerformanceTestInterface';
import { TestDiscordEventBuilder } from '../builders/TestDiscordEventBuilder';
import { createTestUserAsync } from '../fixtures/users';
import { createTestServerAsync } from '../fixtures/servers';
import { createTestChannelAsync } from '../fixtures/channels';
import { createTestGameAsync } from '../fixtures/games';
import Logger, { loggerColors, loggerEmojis, LogLevel } from '../../src/utils/Logger';
import GameService from '../../src/services/domain/GameService';
import { EventService } from '../../src/services/application/EventService';
import { handleCommand } from '../../src/utils/Commands';
import { CommandEnum } from '../../src/interfaces/enums/commands/CommandEnum';
import { GameTypeEnum } from '../../src/interfaces/enums/database/GameTypeEnum';
import { DifficultyEnum } from '../../src/interfaces/enums/games/DifficultyEnum';
import Webhook, { WebhookType } from '../../src/utils/Webhook';

export class PerformanceTestHelper {
    private memorySnapshots: number[] = [];
    private gcCycles: number = 0;
    private cpuStartTime: number = 0;
    private cpuStartUsage: NodeJS.CpuUsage = { user: 0, system: 0 };

    public async runSingleEventTest(config: PerformanceTestConfig): Promise<PerformanceTestResult> {
        Logger.logDebug(`Starting single event performance test with ${config.eventCount} events`);
        
        const testStartTime = Date.now();
        this.collectMemoryMetrics();
        this.startCpuMonitoring();

        try {
            const events = await this.generateEvents(config);
            const results: PerformanceMetrics[] = [];

            for (const event of events) {
                const eventStartTime = Date.now();
                await this.processEvent(event);
                const eventDuration = Date.now() - eventStartTime;
                
                results.push({
                    totalDuration: eventDuration,
                    averageResponseTime: eventDuration,
                    minResponseTime: eventDuration,
                    maxResponseTime: eventDuration,
                    throughput: 1000 / eventDuration, // events per second
                    memoryUsage: {
                        initial: this.memorySnapshots[0] || 0,
                        peak: Math.max(...this.memorySnapshots),
                        final: this.getCurrentMemoryUsage()
                    },
                    errorRate: 0,
                    successRate: 1.0
                });
            }

            const totalDuration = Date.now() - testStartTime;
            const aggregatedMetrics = this.aggregateMetrics(results);

            return {
                suite: 'Performance',
                test: 'single_event_test',
                success: true,
                duration: totalDuration,
                metrics: aggregatedMetrics,
                eventBreakdown: new Map(),
                resourceUsage: {
                    cpuUsage: this.getCpuUsage(),
                    memoryLeaks: this.detectMemoryLeaks(),
                    gcCycles: this.gcCycles
                }
            };

        } catch (error) {
            Logger.logError('Single event performance test failed', error as Error);
            return {
                suite: 'Performance',
                test: 'single_event_test',
                success: false,
                duration: Date.now() - testStartTime,
                error: error as Error,
                metrics: this.getEmptyMetrics(),
                eventBreakdown: new Map(),
                resourceUsage: {
                    cpuUsage: 0,
                    memoryLeaks: false,
                    gcCycles: 0
                }
            };
        }
    }

    public async runParallelEventTest(config: PerformanceTestConfig): Promise<PerformanceTestResult> {
        Logger.logDebug(`Starting parallel event performance test with ${config.eventCount} events, concurrency: ${config.concurrency}`);
        
        const testStartTime = Date.now();
        this.collectMemoryMetrics();
        this.startCpuMonitoring();

        try {
            const events = await this.generateEvents(config);
            const results: PerformanceMetrics[] = [];
            
            // Process events in batches based on concurrency
            const batches = this.createBatches(events, config.concurrency);
            
            for (const batch of batches) {
                const batchStartTime = Date.now();
                const promises = batch.map(async (event) => {
                    const eventStartTime = Date.now();
                    await this.processEvent(event);
                    return Date.now() - eventStartTime;
                });

                const batchDurations = await Promise.all(promises);
                const batchDuration = Date.now() - batchStartTime;
                
                results.push({
                    totalDuration: batchDuration,
                    averageResponseTime: batchDurations.reduce((a, b) => a + b, 0) / batchDurations.length,
                    minResponseTime: Math.min(...batchDurations),
                    maxResponseTime: Math.max(...batchDurations),
                    throughput: (batch.length * 1000) / batchDuration,
                    memoryUsage: {
                        initial: this.memorySnapshots[0] || 0,
                        peak: Math.max(...this.memorySnapshots),
                        final: this.getCurrentMemoryUsage()
                    },
                    errorRate: 0,
                    successRate: 1.0
                });
            }

            const totalDuration = Date.now() - testStartTime;
            const aggregatedMetrics = this.aggregateMetrics(results);

            return {
                suite: 'Performance',
                test: 'parallel_event_test',
                success: true,
                duration: totalDuration,
                metrics: aggregatedMetrics,
                eventBreakdown: new Map(),
                resourceUsage: {
                    cpuUsage: this.getCpuUsage(),
                    memoryLeaks: this.detectMemoryLeaks(),
                    gcCycles: this.gcCycles
                }
            };

        } catch (error) {
            Logger.logError('Parallel event performance test failed', error as Error);
            return {
                suite: 'Performance',
                test: 'parallel_event_test',
                success: false,
                duration: Date.now() - testStartTime,
                error: error as Error,
                metrics: this.getEmptyMetrics(),
                eventBreakdown: new Map(),
                resourceUsage: {
                    cpuUsage: 0,
                    memoryLeaks: false,
                    gcCycles: 0
                }
            };
        }
    }

    public async runLoadTest(config: PerformanceTestConfig): Promise<PerformanceTestResult> {
        Logger.logDebug(`Starting load test with ${config.eventCount} events, concurrency: ${config.concurrency}`);
        
        const testStartTime = Date.now();
        this.collectMemoryMetrics();
        this.startCpuMonitoring();

        try {
            // Warmup phase
            if (config.warmupEvents && config.warmupEvents > 0) {
                Logger.logDebug(`Running warmup with ${config.warmupEvents} events`);
                const warmupEvents = await this.generateEvents({
                    ...config,
                    eventCount: config.warmupEvents
                });
                
                for (const event of warmupEvents) {
                    await this.processEvent(event);
                }
            }

            // Main test phase
            const events = await this.generateEvents(config);
            const results: PerformanceMetrics[] = [];
            
            // Process all events with specified concurrency
            const batches = this.createBatches(events, config.concurrency);
            
            for (const batch of batches) {
                const batchStartTime = Date.now();
                const promises = batch.map(async (event) => {
                    const eventStartTime = Date.now();
                    try {
                        await this.processEvent(event);
                        return { duration: Date.now() - eventStartTime, success: true };
                    } catch (error) {
                        Logger.logDebug(`Event processing failed: ${(error as Error).message}`);
                        return { duration: Date.now() - eventStartTime, success: false };
                    }
                });

                const batchResults = await Promise.all(promises);
                const batchDuration = Date.now() - batchStartTime;
                const successCount = batchResults.filter(r => r.success).length;
                const errorCount = batchResults.length - successCount;
                
                results.push({
                    totalDuration: batchDuration,
                    averageResponseTime: batchResults.reduce((a, b) => a + b.duration, 0) / batchResults.length,
                    minResponseTime: Math.min(...batchResults.map(r => r.duration)),
                    maxResponseTime: Math.max(...batchResults.map(r => r.duration)),
                    throughput: (batch.length * 1000) / batchDuration,
                    memoryUsage: {
                        initial: this.memorySnapshots[0] || 0,
                        peak: Math.max(...this.memorySnapshots),
                        final: this.getCurrentMemoryUsage()
                    },
                    errorRate: errorCount / batchResults.length,
                    successRate: successCount / batchResults.length
                });
            }

            const totalDuration = Date.now() - testStartTime;
            const aggregatedMetrics = this.aggregateMetrics(results);

            return {
                suite: 'Performance',
                test: 'load_test',
                success: true,
                duration: totalDuration,
                metrics: aggregatedMetrics,
                eventBreakdown: new Map(),
                resourceUsage: {
                    cpuUsage: this.getCpuUsage(),
                    memoryLeaks: this.detectMemoryLeaks(),
                    gcCycles: this.gcCycles
                }
            };

        } catch (error) {
            Logger.logError('Load test failed', error as Error);
            return {
                suite: 'Performance',
                test: 'load_test',
                success: false,
                duration: Date.now() - testStartTime,
                error: error as Error,
                metrics: this.getEmptyMetrics(),
                eventBreakdown: new Map(),
                resourceUsage: {
                    cpuUsage: 0,
                    memoryLeaks: false,
                    gcCycles: 0
                }
            };
        }
    }

    private async generateEvents(config: PerformanceTestConfig): Promise<InteractionEvent[]> {
        const events: InteractionEvent[] = [];
        const user = await createTestUserAsync();
        const server = await createTestServerAsync();
        const channel = await createTestChannelAsync();

        // Create a test game for MESSAGE events if needed
        let gameCreated = false;
        if (config.eventTypes.includes(EventTypeEnum.MESSAGE)) {
            try {
                await createTestGameAsync({
                    ChannelId: channel,
                    ServerId: server.ServerId!,
                    GameTypeEnum: GameTypeEnum.ANAGRAM,
                    Answer: 'test',
                    SettingsJSON: { difficulty: DifficultyEnum.MEDIUM }
                });
                gameCreated = true;
                Logger.logDebug(`Created test game for channel: ${channel}`);
            } catch (error) {
                Logger.logDebug(`Failed to create test game: ${(error as Error).message}`);
            }
        }

        for (let i = 0; i < config.eventCount; i++) {
            const eventType = config.eventTypes[i % config.eventTypes.length];
            let event: InteractionEvent;

            switch (eventType) {
                case EventTypeEnum.MESSAGE:
                    event = TestDiscordEventBuilder.create()
                        .withUser({ id: user.UserId! })
                        .withServer({ id: server.ServerId! })
                        .withChannel({ id: channel })
                        .buildMessageEvent(`test message ${i}`);
                    break;
                case EventTypeEnum.SLASH_COMMAND:
                    event = TestDiscordEventBuilder.create()
                        .withUser({ id: user.UserId! })
                        .withServer({ id: server.ServerId! })
                        .withChannel({ id: channel })
                        .buildSlashCommandEvent(CommandEnum.GAMES, {
                            game: GameTypeEnum.ANAGRAM.toString().toLowerCase()
                        });
                    break;
                case EventTypeEnum.BUTTON:
                    event = TestDiscordEventBuilder.create()
                        .withUser({ id: user.UserId! })
                        .withServer({ id: server.ServerId! })
                        .withChannel({ id: channel })
                        .buildButtonEvent(`test_button_${i}`);
                    break;
                default:
                    // Default to message event
                    event = TestDiscordEventBuilder.create()
                        .withUser({ id: user.UserId! })
                        .withServer({ id: server.ServerId! })
                        .withChannel({ id: channel })
                        .buildMessageEvent(`test message ${i}`);
            }

            events.push(event);
        }

        return events;
    }

    private async processEvent(event: InteractionEvent): Promise<void> {
        try {
            if (event.type === EventTypeEnum.SLASH_COMMAND) {
                const command = (event as any).command;
                if (command) {
                    await handleCommand(command, event);
                }
            } else if (event.type === EventTypeEnum.MESSAGE) {
                await GameService.handleGameAsync(event as any);
            } else if (event.type === EventTypeEnum.BUTTON) {
                // Skip button events that don't have handlers (common in performance tests)
                Logger.logDebug(`Skipping button event: ${(event as any).customId}`);
                return;
            } else {
                await EventService.handleEventAsync(event);
            }
        } catch (error) {
            // For performance tests, we'll log but not throw for certain expected errors
            const errorMessage = (error as Error).message;
            if (errorMessage.includes('No handler found') || 
                errorMessage.includes('Game not found')) {
                Logger.logDebug(`Expected error in performance test: ${errorMessage}`);
                return; // Don't throw, just skip this event
            }
            Logger.logDebug(`Event processing error: ${errorMessage}`);
            throw error;
        }
    }

    private createBatches<T>(items: T[], batchSize: number): T[][] {
        const batches: T[][] = [];
        for (let i = 0; i < items.length; i += batchSize) {
            batches.push(items.slice(i, i + batchSize));
        }
        return batches;
    }

    private aggregateMetrics(results: PerformanceMetrics[]): PerformanceMetrics {
        if (results.length === 0) {
            return this.getEmptyMetrics();
        }

        const totalDuration = results.reduce((sum, r) => sum + r.totalDuration, 0);
        const totalResponseTime = results.reduce((sum, r) => sum + r.averageResponseTime, 0);
        const minResponseTime = Math.min(...results.map(r => r.minResponseTime));
        const maxResponseTime = Math.max(...results.map(r => r.maxResponseTime));
        const totalThroughput = results.reduce((sum, r) => sum + r.throughput, 0);
        const totalErrors = results.reduce((sum, r) => sum + r.errorRate, 0);
        const totalSuccesses = results.reduce((sum, r) => sum + r.successRate, 0);

        return {
            totalDuration,
            averageResponseTime: totalResponseTime / results.length,
            minResponseTime,
            maxResponseTime,
            throughput: totalThroughput,
            memoryUsage: {
                initial: results[0]?.memoryUsage.initial || 0,
                peak: Math.max(...results.map(r => r.memoryUsage.peak)),
                final: results[results.length - 1]?.memoryUsage.final || 0
            },
            errorRate: totalErrors / results.length,
            successRate: totalSuccesses / results.length
        };
    }

    private collectMemoryMetrics(): void {
        if (global.gc) {
            global.gc();
            this.gcCycles++;
        }
        this.memorySnapshots.push(this.getCurrentMemoryUsage());
    }

    private getCurrentMemoryUsage(): number {
        const usage = process.memoryUsage();
        return usage.heapUsed / 1024 / 1024; // Convert to MB
    }

    private startCpuMonitoring(): void {
        this.cpuStartTime = Date.now();
        this.cpuStartUsage = process.cpuUsage();
    }

    private getCpuUsage(): number {
        const currentUsage = process.cpuUsage(this.cpuStartUsage);
        const currentTime = Date.now();
        const elapsedTime = (currentTime - this.cpuStartTime) * 1000; // Convert to microseconds
        
        const totalCpuTime = currentUsage.user + currentUsage.system;
        const cpuPercentage = (totalCpuTime / elapsedTime) * 100;
        
        return Math.min(cpuPercentage, 100); // Cap at 100%
    }

    private detectMemoryLeaks(): boolean {
        if (this.memorySnapshots.length < 2) return false;
        
        const initial = this.memorySnapshots[0];
        const final = this.memorySnapshots[this.memorySnapshots.length - 1];
        const growth = final - initial;
        
        // Consider it a potential leak if memory grew by more than 50MB
        return growth > 50;
    }

    private getEmptyMetrics(): PerformanceMetrics {
        return {
            totalDuration: 0,
            averageResponseTime: 0,
            minResponseTime: 0,
            maxResponseTime: 0,
            throughput: 0,
            memoryUsage: {
                initial: 0,
                peak: 0,
                final: 0
            },
            errorRate: 0,
            successRate: 0
        };
    }

    public reset(): void {
        this.memorySnapshots = [];
        this.gcCycles = 0;
    }

    public logPerformance(metrics: PerformanceTestResult): void {
        Logger.logDebug(`Performance test metrics: ${JSON.stringify(metrics)}`);
        Webhook.sendDiscordEmbed(this.createPerformanceTemplateAsync(metrics), WebhookType.DEBUG);
    }

    private createPerformanceTemplateAsync(metrics: PerformanceTestResult): any {
        return {
            title: `${loggerEmojis[LogLevel.TEST]} Performance Test`,
            description: `Performance test completed: ${metrics.suite} - ${metrics.test}`,
            color: loggerColors[LogLevel.TEST],
            timestamp: new Date().toISOString(),
            fields: [
                {
                    name: 'Suite',
                    value: metrics.suite,
                    inline: true
                },
                {
                    name: 'Test',
                    value: metrics.test,
                    inline: true
                },
                {
                    name: 'Duration',
                    value: `${metrics.duration}ms`,
                    inline: true
                },
                {
                    name: 'Total Duration',
                    value: `${metrics.metrics.totalDuration}ms`,
                    inline: true
                },
                {
                    name: 'Average Response Time',
                    value: `${metrics.metrics.averageResponseTime}ms`,
                    inline: true
                },
                {
                    name: 'Min Response Time',
                    value: `${metrics.metrics.minResponseTime}ms`,
                    inline: true
                },
                {
                    name: 'Max Response Time',
                    value: `${metrics.metrics.maxResponseTime}ms`,
                    inline: true
                },
                {
                    name: 'Throughput',
                    value: `${metrics.metrics.throughput.toFixed(2)} events/sec`,
                    inline: true
                },
                {
                    name: 'Success Rate',
                    value: `${(metrics.metrics.successRate * 100).toFixed(1)}%`,
                    inline: true
                },
                {
                    name: 'Memory Usage',
                    value: `Peak: ${(metrics.metrics.memoryUsage.peak / 1024 / 1024).toFixed(2)}MB\nFinal: ${(metrics.metrics.memoryUsage.final / 1024 / 1024).toFixed(2)}MB`,
                    inline: false
                },
                {
                    name: 'CPU Usage',
                    value: `${metrics.resourceUsage.cpuUsage.toFixed(2)}%`,
                    inline: true
                },
                {
                    name: 'GC Cycles',
                    value: `${metrics.resourceUsage.gcCycles}`,
                    inline: true
                },
                {
                    name: 'Memory Leaks',
                    value: metrics.resourceUsage.memoryLeaks ? '⚠️ Detected' : '✅ None',
                    inline: true
                }
            ],
            footer: {
                text: 'DisGames Performance Logger'
            }
        };
    }
}

export default PerformanceTestHelper;
