#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import TestMode from '../src/utils/application/TestMode';
import TestConfig from './config/TestConfig';
import DatabaseTestHelper from './helpers/DatabaseTestHelper';
import Logger from '../src/utils/application/Logger';
import { getConfigValue } from '../src/utils/application/Config';
import { EnvConfigEnum } from '../src/interfaces/enums/application/EnvConfigEnum';
import { TestSuite, TestResult, TestRunResults, TestCase } from './interfaces/TestRunnerInterface';

export class TestRunner {
    private suites: TestSuite[] = [];
    private config = TestConfig.environment;
    private results: TestResult[] = [];
    private debugMode: boolean = false;

    public addSuite(suite: TestSuite): void {
        this.suites.push(suite);
    }

    public async runAllAsync(): Promise<TestRunResults> {
        Logger.logTest('=====================================');

        const startTime = Date.now();
        let totalTests = 0;
        let passedTests = 0;
        let failedTests = 0;
        let skippedTests = 0;

        try {
            // Setup test environment
            await this.setupTestEnvironmentAsync();

            // Run all test suites
            for (const suite of this.suites) {
                if (suite.disabled) {
                    Logger.logInfo(`⏭️ Skipping suite: ${suite.name}`);
                    continue;
                }

                Logger.logInfo(`📦 Running suite: ${suite.name}`);
                if (suite.description)
                    Logger.logInfo(`${suite.description}`);

                const suiteResults = await this.runSuiteAsync(suite);
                this.results.push(...suiteResults);

                const suiteStats = this.calculateSuiteStats(suiteResults);
                totalTests += suiteStats.total;
                passedTests += suiteStats.passed;
                failedTests += suiteStats.failed;
                skippedTests += suiteStats.skipped;

                this.printSuiteResults(suite.name, suiteStats);
            }

        } catch (error) {
            Logger.logError('❌ Test environment setup failed:', error as Error);
            return {
                total: 0,
                passed: 0,
                failed: 1,
                skipped: 0,
                duration: Date.now() - startTime,
                results: []
            };
        } finally {
            // Cleanup test environment
            await this.teardownTestEnvironmentAsync();
        }

        const totalDuration = Date.now() - startTime;

        const finalResults: TestRunResults = {
            total: totalTests,
            passed: passedTests,
            failed: failedTests,
            skipped: skippedTests,
            duration: totalDuration,
            results: this.results
        };

        this.printFinalResults(finalResults);
        await this.sendResultsToWebhookAsync(finalResults);

        return finalResults;
    }

    private async runSuiteAsync(suite: TestSuite): Promise<TestResult[]> {
        const suiteResults: TestResult[] = [];

        try {
            // Run suite setup
            if (suite.setup) {
                await suite.setup();
            }

            // Run all tests in the suite
            for (const test of suite.tests) {
                if (test.skip) {
                    suiteResults.push({
                        suite: suite.name,
                        test: test.name,
                        success: false,
                        duration: 0,
                        error: new Error('Test skipped')
                    });
                    continue;
                }

                const testResult = await this.runTestAsync(suite, test);
                suiteResults.push(testResult);
            }

        } catch (error) {
            Logger.logError(`❌ Suite ${suite.name} setup failed:`, error as Error);
        } finally {
            // Run suite teardown
            if (suite.teardown) {
                try {
                    await suite.teardown();
                } catch (error) {
                    Logger.logError(`⚠️  Suite ${suite.name} teardown failed:`, error as Error);
                }
            }
        }

        return suiteResults;
    }

    private async runTestAsync(suite: TestSuite, test: TestCase): Promise<TestResult> {
        const startTime = Date.now();

        try {
            // Run beforeEach
            if (suite.beforeEach) {
                await suite.beforeEach();
            }

            const invokeTest = async () => {
                if (this.debugMode) {
                    await test.testFunction();
                } else {
                    const timeout = test.timeout || this.config.testTimeout;
                    await this.runWithTimeoutAsync(test.testFunction, timeout);
                }
            };

            if (test.bypassTransaction) {
                // Tests that exercise the pool/transaction layer itself must run outside
                // the ambient test transaction, otherwise every query is pinned to one connection.
                await invokeTest();
            } else {
                await DatabaseTestHelper.runTestCaseAsync(invokeTest);
            }

            const duration = Date.now() - startTime;
            Logger.logInfo(`✅ ${test.name} (${duration}ms)`);

            return {
                suite: suite.name,
                test: test.name,
                success: true,
                duration
            };

        } catch (error) {
            const duration = Date.now() - startTime;
            Logger.logInfo(`❌ ${test.name} (${duration}ms)`);
            Logger.logInfo(`   Error: ${(error as Error).message}`);

            return {
                suite: suite.name,
                test: test.name,
                success: false,
                duration,
                error: error as Error
            };

        } finally {
            try {
                // Run afterEach
                if (suite.afterEach) {
                    await suite.afterEach();
                }
            } catch (error) {
                Logger.logError(`⚠️ Test cleanup failed for ${test.name}:`, error as Error);
            }
        }
    }

    private async runWithTimeoutAsync(testFunction: () => Promise<void>, timeoutMs: number): Promise<void> {
        return new Promise(async (resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error(`Test timed out after ${timeoutMs}ms`));
            }, timeoutMs);

            try {
                await testFunction();
                clearTimeout(timer);
                resolve();
            } catch (error) {
                clearTimeout(timer);
                reject(error);
            }
        });
    }

    private async setupTestEnvironmentAsync(): Promise<void> {
        Logger.logTest('🔧 Setting up test environment...');

        // Setup database for testing
        await DatabaseTestHelper.setupForTestAsync();

        Logger.logTest('✅ Test environment ready');
    }

    private async teardownTestEnvironmentAsync(): Promise<void> {
        Logger.logTest('🧹 Cleaning up test environment...');

        // Cleanup database
        await DatabaseTestHelper.teardownAsync();

        Logger.logTest('✅ Test environment cleaned up');
    }

    private calculateSuiteStats(results: TestResult[]): { total: number; passed: number; failed: number; skipped: number } {
        return {
            total: results.length,
            passed: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success && r.error?.message !== 'Test skipped').length,
            skipped: results.filter(r => r.error?.message === 'Test skipped').length
        };
    }

    private printSuiteResults(suiteName: string, stats: { total: number; passed: number; failed: number; skipped: number }): void {
        const { total, passed, failed, skipped } = stats;
        const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

        Logger.logInfo(`📊 Results: ${passed}/${total} passed (${passRate}%)`);
        if (failed > 0)
            Logger.logInfo(`❌ Failed: ${failed}`);

        if (skipped > 0)
            Logger.logInfo(`⏭️ Skipped: ${skipped}`);
    }

    private async sendResultsToWebhookAsync(results: TestRunResults): Promise<void> {
        const webhookUrl = getConfigValue(EnvConfigEnum.TEST_DISCORD_WEBHOOK_URL);
        if (!webhookUrl)
            return;

        const { total, passed, failed, skipped, duration } = results;
        const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

        const lines: string[] = [
            '# :abacus: Final Test Results',
            '',
            `**When:** <t:${Math.floor(Date.now() / 1000)}:R>`,
            '',
            `**Total Tests:** ${total}`,
            `> Passed: **${passed}** *(${passRate}%)*`,
            `> Failed: **${failed}**`,
            `> Skipped: **${skipped}**`,
            `> Duration: *${duration}ms*`,
        ];

        if (failed > 0) {
            lines.push('');
            lines.push('**Failed Tests:**');
            results.results
                .filter(r => !r.success && r.error?.message !== 'Test skipped')
                .forEach(result => {
                    lines.push(`> ${result.suite} → ${result.test}`);
                    lines.push(`> *${result.error?.message}*`);
                });
        }

        lines.push('');
        lines.push(failed === 0 ? '*All tests passed!*' : '*Some tests failed.*');

        try {
            await axios.post(webhookUrl, { content: lines.join('\n') });
        } catch (error) {
            Logger.logError('Failed to send test results to webhook:', error as Error);
        }
    }

    private printFinalResults(results: TestRunResults): void {
        Logger.logInfo('# Test Results');

        const { total, passed, failed, skipped, duration } = results;
        const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

        Logger.logInfo(`Total Tests: ${total}`);
        Logger.logInfo(`✅ Passed: ${passed} (${passRate}%)`);
        Logger.logInfo(`❌ Failed: ${failed}`);
        Logger.logInfo(`⏭️  Skipped: ${skipped}`);
        Logger.logInfo(`⏱️  Duration: ${duration}ms`);

        if (failed > 0) {
            Logger.logInfo('💥 Failed Tests:');
            results.results
                .filter(r => !r.success && r.error?.message !== 'Test skipped')
                .forEach(result => {
                    Logger.logInfo(`${result.suite} → ${result.test}`);
                    Logger.logInfo(`  ${result.error?.message}`);
                });
        }

        Logger.logInfo(failed === 0 ? '🎉 All tests passed!' : '💔 Some tests failed');
    }

    public async loadTestFiles(directory: string): Promise<void> {
        const testFiles = this.findTestFiles(directory);

        for (const file of testFiles) {
            try {
                const testModule = await import(file);
                if (testModule.default && typeof testModule.default === 'function') {
                    await testModule.default(this);
                }
            } catch (error) {
                Logger.logError(`Failed to load test file ${file}:`, error as Error);
            }
        }
    }

    private findTestFiles(directory: string): string[] {
        const files: string[] = [];

        if (!fs.existsSync(directory)) {
            return files;
        }

        const items = fs.readdirSync(directory);

        for (const item of items) {
            const fullPath = path.join(directory, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                files.push(...this.findTestFiles(fullPath));
            } else if (item.endsWith('.test.ts') || item.endsWith('.spec.ts')) {
                files.push(fullPath);
            }
        }

        return files;
    }

    public enableDebugMode(): void {
        this.debugMode = true;
    }
}

export async function main(): Promise<void> {
    const args = process.argv.slice(2);
    const runner = new TestRunner();

    try {
        // Debug mode
        if (args.includes('--debug')) {
            TestMode.enableDebugMode();
            Logger.logTest('Debug mode enabled');
            runner.enableDebugMode();
        }

        // Load test files based on arguments
        await runner.loadTestFiles(path.join(__dirname, 'unit'));
        await runner.loadTestFiles(path.join(__dirname, 'integration'));

        if (args.includes('--performance') || args.includes('--all'))
            await runner.loadTestFiles(path.join(__dirname, 'performance'));

        // Run all loaded tests
        const results = await runner.runAllAsync();

        // Exit with appropriate code
        process.exit(results.failed > 0 ? 1 : 0);

    } catch (error) {
        Logger.logError('❌ Test runner failed:', error as Error);
        process.exit(1);
    } finally {
        if (args.includes('--debug'))
            TestMode.disableDebugMode();
        TestMode.disable();
    }
}

export default TestRunner;