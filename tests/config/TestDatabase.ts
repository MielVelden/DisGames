import * as mysql from 'mysql2/promise';
import TestConfig from './TestConfig';
import Logger from '../../src/utils/Logger';
import { DatabaseHelper } from '../../src/utils/database/DatabaseHelper';
import { TableEnum } from '../../src/interfaces/enums';
import { getTableName } from '../helpers/TableNameMapping';

export class TestDatabase {
    private static _instance: TestDatabase;
    private _connection: mysql.Connection | null = null;
    private _isInTransaction: boolean = false;
    private _originalConnection: mysql.Connection | null = null;

    private constructor() {}

    public static getInstance(): TestDatabase {
        if (!TestDatabase._instance) {
            TestDatabase._instance = new TestDatabase();
        }
        return TestDatabase._instance;
    }

    public async initializeAsync(): Promise<void> {
        const config = TestConfig.environment;
        
        try {
            const url = new URL(config.databaseUrl);
            
            this._connection = await mysql.createConnection({
                host: url.hostname,
                user: url.username,
                database: url.pathname.replace(/^\//, ''),
                password: url.password,
                port: Number(url.port) || 3306,
            });

            Logger.logInfo('Test database connection established');
        } catch (error) {
            Logger.logError('Failed to connect to test database', error as Error);
            throw error;
        }
    }

    public async startTransactionAsync(): Promise<void> {
        if (!this._connection) {
            throw new Error('Database connection not established');
        }

        if (this._isInTransaction) {
            throw new Error('Transaction already started');
        }

        await this._connection.beginTransaction();
        this._isInTransaction = true;
        Logger.logInfo('Test transaction started');
    }

    public async rollbackTransactionAsync(): Promise<void> {
        if (!this._connection) {
            throw new Error('Database connection not established');
        }

        if (!this._isInTransaction) {
            Logger.logInfo('No active transaction to rollback');
            return;
        }

        await this._connection.rollback();
        this._isInTransaction = false;
        Logger.logInfo('Test transaction rolled back');
    }

    public async commitTransactionAsync(): Promise<void> {
        if (!this._connection) {
            throw new Error('Database connection not established');
        }

        if (!this._isInTransaction) {
            throw new Error('No active transaction to commit');
        }

        await this._connection.commit();
        this._isInTransaction = false;
        Logger.logInfo('Test transaction committed');
    }

    public async runQueryAsync(query: string, params?: any[]): Promise<any[]> {
        if (!this._connection) {
            throw new Error('Database connection not established');
        }

        try {
            Logger.logInfo(`Query: ${query}${params ? ` with params ${JSON.stringify(params)}` : ''}`);
            const [rows] = await this._connection.query(query, params);
            
            // For non-SELECT queries (INSERT, UPDATE, DELETE), return empty array
            const trimmedQuery = query.trim().toUpperCase();
            if (!trimmedQuery.startsWith('SELECT') && !trimmedQuery.startsWith('CALL')) {
                return [];
            }
            
            const results = rows as any[];
            
            // Process results to handle MultiLingualString and JSON fields like BaseRepository
            return DatabaseHelper.processResultsFromDatabase(results);
        } catch (error) {
            Logger.logError('Test database query failed', error as Error);
            throw error;
        }
    }

    public async runRawQueryAsync(query: string, params?: any[]): Promise<any[]> {
        if (!this._connection) {
            throw new Error('Database connection not established');
        }

        try {
            Logger.logInfo(`Raw Query: ${query}${params ? ` with params ${JSON.stringify(params)}` : ''}`);
            const [rows] = await this._connection.query(query, params);
            return rows as any[];
        } catch (error) {
            Logger.logError('Test database raw query failed', error as Error);
            throw error;
        }
    }

    public async insertAsync(tableName: TableEnum, data: any): Promise<any> {
        const processedData = DatabaseHelper.processEntityForDatabase(data);
        const keys = Object.keys(processedData).join(', ');
        const values = Object.values(processedData).map(() => '?').join(', ');
        const query = `INSERT INTO ${getTableName(tableName)} (${keys}) VALUES (${values})`;
        const params = Object.values(processedData);
        
        const result = await this.runRawQueryAsync(query, params);
        
        // Return the inserted record
        //const selectQuery = `SELECT * FROM ${tableName} ORDER BY Id DESC LIMIT 1`;
        //const result = await this.runQueryAsync(selectQuery);
        return result?.[0] || null;
    }

    public async updateAsync(tableName: TableEnum, id: number, data: any): Promise<any> {
        const processedData = DatabaseHelper.processEntityForDatabase(data);
        const setClause = Object.keys(processedData)
            .filter(key => key !== 'Id')
            .map(key => `${key} = ?`)
            .join(', ');

        const query = `UPDATE ${getTableName(tableName)} SET ${setClause} WHERE Id = ?`;
        const params = [...Object.values(processedData).filter((_, index) => Object.keys(processedData)[index] !== 'Id'), id];

        await this.runRawQueryAsync(query, params);
        
        // Return the updated record
        const selectQuery = `SELECT * FROM ${getTableName(tableName)} WHERE Id = ?`;
        const result = await this.runQueryAsync(selectQuery, [id]);
        return result?.[0] || null;
    }

    public async callStoredProcedureAsync(procedureName: string, params: any[] = []): Promise<any[]> {
        const query = `CALL ${procedureName}(${params.map(() => '?').join(', ')})`;
        const results = await this.runRawQueryAsync(query, params);
        
        // Process stored procedure results
        return DatabaseHelper.processStoredProcedureResults(results);
    }

    public getConnection(): mysql.Connection {
        if (!this._connection) {
            throw new Error('Database connection not established');
        }
        return this._connection;
    }

    public isInTransaction(): boolean {
        return this._isInTransaction;
    }

    public async closeAsync(): Promise<void> {
        if (this._isInTransaction) {
            await this.rollbackTransactionAsync();
        }

        if (this._connection) {
            await this._connection.end();
            this._connection = null;
            Logger.logInfo('Test database connection closed');
        }
    }

    public static async reset(): Promise<void> {
        if (TestDatabase._instance) {
            await TestDatabase._instance.closeAsync();
            TestDatabase._instance = undefined as any;
        }
    }
}

export default TestDatabase.getInstance();