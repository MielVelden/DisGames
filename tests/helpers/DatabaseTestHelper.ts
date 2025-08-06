import TestDatabase from '../config/TestDatabase';
import TestConfig from '../config/TestConfig';
import { runQueryAsync } from '../../src/repositories/util/ConnectionHandler';
import { CLEANUP_ORDER, getTableName } from './TableNameMapping';
import Logger from '../../src/utils/Logger';

export class DatabaseTestHelper {
    private static originalRunQuery: typeof runQueryAsync;
    private static isTestModeEnabled: boolean = false;

    public static async setupForTestAsync(): Promise<void> {
        await TestDatabase.initializeAsync();
        this.enableTestMode();
    }

    public static async startTestCaseAsync(): Promise<void> {
        if (TestConfig.environment.rollbackTransactions) {
            await TestDatabase.startTransactionAsync();
        }
    }

    public static async endTestCaseAsync(): Promise<void> {
        if (TestConfig.environment.rollbackTransactions && TestDatabase.isInTransaction()) {
            await TestDatabase.rollbackTransactionAsync();
        }
    }

    public static async teardownAsync(): Promise<void> {
        this.disableTestMode();
        await TestDatabase.closeAsync();
    }

    private static enableTestMode(): void {
        if (this.isTestModeEnabled) {
            return;
        }

        // Store original function
        this.originalRunQuery = runQueryAsync;

        // Override the runQueryAsync function to use test database
        const testRunQuery = async (query: string, params?: any[]): Promise<any[] | undefined> => {
            return await TestDatabase.runQueryAsync(query, params);
        };

        // Replace the function in the module
        const module = require('../../src/repositories/util/ConnectionHandler');
        Object.defineProperty(module, 'runQueryAsync', {
            value: testRunQuery,
            configurable: true,
            writable: true
        });

        this.isTestModeEnabled = true;
        Logger.logInfo('Test mode enabled - database queries redirected to test database');
    }

    private static disableTestMode(): void {
        if (!this.isTestModeEnabled || !this.originalRunQuery) {
            return;
        }

        // Restore original function
        const module = require('../../src/repositories/util/ConnectionHandler');
        Object.defineProperty(module, 'runQueryAsync', {
            value: this.originalRunQuery,
            configurable: true,
            writable: true
        });

        this.isTestModeEnabled = false;
        Logger.logInfo('Test mode disabled - database queries restored to production');
    }

    public static async cleanDatabase(): Promise<void> {
        // Optional: Clean specific test data if needed
        // This can be used for integration tests that need a clean slate
        // Clean in correct order to respect foreign key constraints
        for (const tableEnum of CLEANUP_ORDER) {
            const tableName = getTableName(tableEnum);
            try {
                await TestDatabase.runQueryAsync(`DELETE FROM ${tableName} WHERE 1=1`);
                Logger.logInfo(`Cleaned test data from table: ${tableName}`);
            } catch (error) {
                Logger.logInfo(`Could not clean table ${tableName}: ${(error as Error)?.message}`);
            }
        }
    }
}

export default DatabaseTestHelper;