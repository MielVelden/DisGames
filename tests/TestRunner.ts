#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import TestConfig from './config/TestConfig';
import DatabaseTestHelper from './helpers/DatabaseTestHelper';
import Logger from '../src/utils/Logger';

export interface TestCase {
    name: string;
    description?: string;
    testFunction: () => Promise<void>;
    timeout?: number;
    skip?: boolean;
    only?: boolean;
}

export interface TestSuite {
    name: string;
    description?: string;
    setup?: () => Promise<void>;
    teardown?: () => Promise<void>;
    beforeEach?: () => Promise<void>;
    afterEach?: () => Promise<void>;
    tests: TestCase[];
}

export interface TestResult {
    suite: string;
    test: string;
    success: boolean;
    duration: number;
    error?: Error;
}

export interface TestRunResults {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
    results: TestResult[];
}

export class TestRunner {
    private suites: TestSuite[] = [];
    private config = TestConfig.environment;
    private results: TestResult[] = [];

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
                Logger.logTest(`\n📦 Running suite: ${suite.name}`);
                if (suite.description) {
                    Logger.logTest(`${suite.description}`);
                }

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
        
        // Print final results
        this.printFinalResults({
            total: totalTests,
            passed: passedTests,
            failed: failedTests,
            skipped: skippedTests,
            duration: totalDuration,
            results: this.results
        });

        return {
            total: totalTests,
            passed: passedTests,
            failed: failedTests,
            skipped: skippedTests,
            duration: totalDuration,
            results: this.results
        };
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

            // Start database transaction
            await DatabaseTestHelper.startTestCaseAsync();

            // Run the actual test with timeout
            const timeout = test.timeout || this.config.testTimeout;
            await this.runWithTimeoutAsync(test.testFunction, timeout);

            const duration = Date.now() - startTime;
            Logger.logTest(`  ✅ ${test.name} (${duration}ms)`);

            return {
                suite: suite.name,
                test: test.name,
                success: true,
                duration
            };

        } catch (error) {
            const duration = Date.now() - startTime;
            Logger.logTest(`  ❌ ${test.name} (${duration}ms)`);
            Logger.logTest(`     Error: ${(error as Error).message}`);

            return {
                suite: suite.name,
                test: test.name,
                success: false,
                duration,
                error: error as Error
            };

        } finally {
            try {
                // Rollback database transaction
                await DatabaseTestHelper.endTestCaseAsync();

                // Run afterEach
                if (suite.afterEach) {
                    await suite.afterEach();
                }
            } catch (error) {
                Logger.logError(`⚠️  Test cleanup failed for ${test.name}:`, error as Error);
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
        
        Logger.logTest(`   📊 Results: ${passed}/${total} passed (${passRate}%)`);
        if (failed > 0) Logger.logTest(`      ❌ Failed: ${failed}`);
        if (skipped > 0) Logger.logTest(`      ⏭️  Skipped: ${skipped}`);
    }

    private printFinalResults(results: TestRunResults): void {
        Logger.logTest('=====================================');
        Logger.logTest('📈 Final Test Results');
        Logger.logTest('=====================================');
        
        const { total, passed, failed, skipped, duration } = results;
        const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
        
        Logger.logTest(`Total Tests: ${total}`);
        Logger.logTest(`✅ Passed: ${passed} (${passRate}%)`);
        Logger.logTest(`❌ Failed: ${failed}`);
        Logger.logTest(`⏭️  Skipped: ${skipped}`);
        Logger.logTest(`⏱️  Duration: ${duration}ms`);
        
        if (failed > 0) {
            Logger.logTest('💥 Failed Tests:');
            results.results
                .filter(r => !r.success && r.error?.message !== 'Test skipped')
                .forEach(result => {
                    Logger.logTest(`   ${result.suite} → ${result.test}`);
                    Logger.logTest(`      ${result.error?.message}`);
                });
        }
        
        Logger.logTest(failed === 0 ? '🎉 All tests passed!' : '💔 Some tests failed');
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
}

// Main execution function
async function main(): Promise<void> {
    const args = process.argv.slice(2);
    const runner = new TestRunner();
    
    try {
        // Load test files based on arguments
        if (args.includes('--unit')) {
            await runner.loadTestFiles(path.join(__dirname, 'unit'));
        } else if (args.includes('--integration')) {
            await runner.loadTestFiles(path.join(__dirname, 'integration'));
        } else {
            // Load all tests
            await runner.loadTestFiles(path.join(__dirname, 'unit'));
            await runner.loadTestFiles(path.join(__dirname, 'integration'));
        }
        
        // Run all loaded tests
        const results = await runner.runAllAsync();
        
        // Exit with appropriate code
        process.exit(results.failed > 0 ? 1 : 0);
        
    } catch (error) {
        Logger.logError('❌ Test runner failed:', error as Error);
        process.exit(1);
    }
}

// Export for programmatic use
export default TestRunner;

// Run if this is the main module
if (require.main === module) {
    main();
}