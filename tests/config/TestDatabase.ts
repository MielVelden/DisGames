import Logger from '../../src/utils/Logger';
import { DatabaseHelper } from '../../src/utils/database/DatabaseHelper';
import { TableEnum } from '../../src/interfaces/enums';
import { closeConnectionAsync, commitTransactionAsync, getTableName, rollbackTransactionAsync, runQueryAsync, startTransactionAsync, validateConnectionAsync } from '../../src/repositories/util/ConnectionHandler';

export class TestDatabase {
    private static _instance: TestDatabase;
    private _isInTransaction: boolean = false;

    private constructor() {}

    public static getInstance(): TestDatabase {
        if (!TestDatabase._instance) {
            TestDatabase._instance = new TestDatabase();
        }
        return TestDatabase._instance;
    }

    public async startTransactionAsync(): Promise<void> {
        if (this._isInTransaction)
            throw new Error('Transaction already started');

        await startTransactionAsync();
        this._isInTransaction = true;
        Logger.logDebug('Test transaction started');
    }

    public async rollbackTransactionAsync(): Promise<void> {
        if (!this.isInTransaction())
            throw new Error('No active transaction to rollback');

        await rollbackTransactionAsync();
        this._isInTransaction = false;
        Logger.logDebug('Test transaction rolled back');
    }

    public async commitTransactionAsync(): Promise<void> {
        if (!this.isInTransaction())
            throw new Error('No active transaction to commit');

        await commitTransactionAsync();
        this._isInTransaction = false;
        Logger.logDebug('Test transaction committed');
    }

    public async runQueryAsync(query: string, params?: any[]): Promise<any[]> {
        await validateConnectionAsync();

        try {
            Logger.logDebug(`Query: ${query}${params ? ` with params ${JSON.stringify(params)}` : ''}`);
            const rows = await runQueryAsync(query, params);
            
            // For non-SELECT queries (INSERT, UPDATE, DELETE), return empty array
            const trimmedQuery = query.trim().toUpperCase();
            if (!trimmedQuery.startsWith('SELECT') && !trimmedQuery.startsWith('CALL')) {
                return [];
            }
            
            // Process results to handle MultiLingualString and JSON fields like BaseRepository
            return DatabaseHelper.processResultsFromDatabase(rows as any[]);
        } catch (error) {
            Logger.logError('Test database query failed', error as Error);
            throw error;
        }
    }

    public async insertAsync(tableName: TableEnum, data: any): Promise<any> {
        const tableNameString = getTableName(tableName);
        const processedData = DatabaseHelper.processEntityForDatabase(data);
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
        const processedData = DatabaseHelper.processEntityForDatabase(data);
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
        return this._isInTransaction;
    }

    public async closeAsync(): Promise<void> {
        if (this.isInTransaction())
            await this.rollbackTransactionAsync();

        await closeConnectionAsync();
    }

    public static async reset(): Promise<void> {
        if (TestDatabase._instance) {
            await TestDatabase._instance.closeAsync();
            TestDatabase._instance = undefined as any;
        }
    }
}

export default TestDatabase.getInstance();