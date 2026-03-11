import TestDatabase from '../config/TestDatabase';
import TestConfig from '../config/TestConfig';
import { createConnectionAsync, getTableName } from '../../src/repositories/util/ConnectionHandler';
import { CLEANUP_ORDER } from './TableNameMapping';
import Logger from '../../src/utils/application/Logger';
import { initAsync } from '../../src/utils/handlers/InitHandler';

export class DatabaseTestHelper {
    private static isTestModeEnabled: boolean = false;

    public static async setupForTestAsync(): Promise<void> {
        await createConnectionAsync();
        await initAsync();
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
        if (this.isTestModeEnabled)
            return;

        this.isTestModeEnabled = true;
        Logger.logInfo('Test mode enabled - database queries redirected to test database');
    }

    private static disableTestMode(): void {
        if (!this.isTestModeEnabled)
            return;

        this.isTestModeEnabled = false;
        Logger.logInfo('Test mode disabled - database queries restored to production');
    }

    public static async cleanDatabase(): Promise<void> {
        for (const tableEnum of CLEANUP_ORDER) {
            const tableName = getTableName(tableEnum);
            try {
                await TestDatabase.runQueryAsync(`DELETE FROM ${tableName} WHERE 1=1`);
                Logger.logDebug(`Cleaned test data from table: ${tableName}`);
            } catch (error) {
                Logger.logDebug(`Could not clean table ${tableName}: ${(error as Error)?.message}`);
            }
        }
    }
}

export default DatabaseTestHelper;