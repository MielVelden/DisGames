import TestDatabase from '../config/TestDatabase';
import { createConnectionAsync, getTableName } from '../../src/repositories/util/ConnectionHandler';
import { CLEANUP_ORDER } from './TableNameMapping';
import Logger from '../../src/utils/application/Logger';
import { initAsync } from '../../src/utils/registries/InitRegistry';

export class DatabaseTestHelper {
    private static isTestModeEnabled: boolean = false;

    public static async setupForTestAsync(): Promise<void> {
        await createConnectionAsync();
        await initAsync();
        this.enableTestMode();
    }

    /**
     * Wraps a test body in a per-test transaction with an ambient TransactionHandle.
     * Any repository call inside picks up the handle automatically — no plumbing needed.
     */
    public static async runTestCaseAsync(body: () => Promise<void>): Promise<void> {
        await TestDatabase.startTransactionAsync();
        try {
            await TestDatabase.withAmbientTransactionAsync(body);
        } finally {
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
                Logger.logDebug(() => `Cleaned test data from table: ${tableName}`);
            } catch (error) {
                Logger.logDebug(() => `Could not clean table ${tableName}: ${(error as Error)?.message}`);
            }
        }
    }
}

export default DatabaseTestHelper;
