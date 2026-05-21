import Logger from '../../src/utils/application/Logger';
import { DatabaseHelper } from '../../src/utils/database/DatabaseHelper';
import { BaseEntityFieldType } from '../../src/interfaces/database/BaseEntity';
import { ExceptionEnum, TableEnum } from '../../src/interfaces/enums';
import {
    closeConnectionAsync,
    commitTransactionAsync,
    getTableName,
    rollbackTransactionAsync,
    runInTransactionAsync,
    runQueryAsync,
    startTransactionAsync,
    validateConnectionAsync,
    TransactionHandle,
} from '../../src/repositories/util/ConnectionHandler';
import { ErrorHelper } from '../../src/utils/application/Error';

export class TestDatabase {
    private static _instance: TestDatabase;
    private _tx: TransactionHandle | null = null;

    private constructor() {}

    public static getInstance(): TestDatabase {
        if (!TestDatabase._instance) {
            TestDatabase._instance = new TestDatabase();
        }
        return TestDatabase._instance;
    }

    public async startTransactionAsync(): Promise<TransactionHandle> {
        if (this._tx)
            throw new Error('Transaction already started');

        this._tx = await startTransactionAsync();
        Logger.logDebug('Test transaction started');
        return this._tx;
    }

    public async rollbackTransactionAsync(): Promise<void> {
        if (!this._tx)
            throw new Error('No active transaction to rollback');

        const tx = this._tx;
        this._tx = null;
        await rollbackTransactionAsync(tx);
        Logger.logDebug('Test transaction rolled back');
    }

    public async commitTransactionAsync(): Promise<void> {
        if (!this._tx)
            throw new Error('No active transaction to commit');

        const tx = this._tx;
        this._tx = null;
        await commitTransactionAsync(tx);
        Logger.logDebug('Test transaction committed');
    }

    /**
     * Runs `body` with the active test transaction installed as the ambient handle, so any
     * repository query inside picks it up automatically via AsyncLocalStorage.
     */
    public async withAmbientTransactionAsync<T>(body: () => Promise<T>): Promise<T> {
        if (!this._tx)
            throw new Error('No active transaction to bind ambient context to');
        return runInTransactionAsync(this._tx, body);
    }

    public async runQueryAsync(query: string, params?: any[]): Promise<any[]> {
        await validateConnectionAsync();

        try {
            Logger.logDebug(() => `Query: ${query}${params ? ` with params ${JSON.stringify(params)}` : ''}`);
            const rows = await runQueryAsync(query, params, this._tx ?? undefined);

            // For non-SELECT queries (INSERT, UPDATE, DELETE), return empty array
            const trimmedQuery = query.trim().toUpperCase();
            if (!trimmedQuery.startsWith('SELECT') && !trimmedQuery.startsWith('CALL')) {
                return [];
            }

            // Process results to handle MultiLingualString and JSON fields like BaseRepository
            return DatabaseHelper.processResultsFromDatabase(rows as any[]);
        } catch (error) {
            Logger.logError('Test database query failed', error as Error);
            ErrorHelper.wrap(error, ExceptionEnum.DATABASE_CONNECTION_FAILED);
        }
    }

    public async insertAsync(tableName: TableEnum, data: any): Promise<any> {
        const tableNameString = getTableName(tableName);
        const fieldEnum = Object.fromEntries(Object.keys(data).map(k => [k, k]));
        const processedData = DatabaseHelper.processEntityForDatabase(data, fieldEnum, () => BaseEntityFieldType.String);
        const keys = Object.keys(processedData).join(', ');
        const values = Object.values(processedData).map(() => '?').join(', ');
        const query = `INSERT INTO ${tableNameString} (${keys}) VALUES (${values})`;
        const params = Object.values(processedData);

        await this.runQueryAsync(query, params);

        // Return the inserted record
        const selectQuery = `SELECT * FROM ${tableNameString} ORDER BY Id DESC LIMIT 1`;
        const result = await this.runQueryAsync(selectQuery);
        return result?.[0] as any;
    }

    public async updateAsync(tableName: TableEnum, id: number, data: any): Promise<any> {
        const tableNameString = getTableName(tableName);
        const fieldEnum = Object.fromEntries(Object.keys(data).map(k => [k, k]));
        const processedData = DatabaseHelper.processEntityForDatabase(data, fieldEnum, () => BaseEntityFieldType.String);
        const setClause = Object.keys(processedData)
            .filter(key => key !== 'Id')
            .map(key => `${key} = ?`)
            .join(', ');

        const query = `UPDATE ${tableNameString} SET ${setClause} WHERE Id = ?`;
        const params = [...Object.values(processedData).filter((_, index) => Object.keys(processedData)[index] !== 'Id'), id];

        await this.runQueryAsync(query, params);

        // Return the updated record
        const selectQuery = `SELECT * FROM ${tableNameString} WHERE Id = ?`;
        const result = await this.runQueryAsync(selectQuery, [id]);
        return result?.[0] as any;
    }

    public async callStoredProcedureAsync(procedureName: string, params: any[] = []): Promise<any[]> {
        const query = `CALL ${procedureName}(${params.map(() => '?').join(', ')})`;
        const results = await this.runQueryAsync(query, params);

        // Process stored procedure results
        return DatabaseHelper.processStoredProcedureResults(results);
    }

    public isInTransaction(): boolean {
        return this._tx !== null;
    }

    public async closeAsync(): Promise<void> {
        if (this.isInTransaction())
            await this.rollbackTransactionAsync();

        await closeConnectionAsync();
    }

    public static async reset(): Promise<void> {
        if (TestDatabase._instance) {
            await TestDatabase._instance.closeAsync();
            TestDatabase._instance = null!;
        }
    }
}

export default TestDatabase.getInstance();
