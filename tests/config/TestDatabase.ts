import * as mysql from 'mysql2/promise';
import TestConfig from './TestConfig';
import Logger from '../../src/utils/Logger';

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
            Logger.logInfo(`Test query: ${query}${params ? ` with params ${JSON.stringify(params)}` : ''}`);
            const [rows] = await this._connection.query(query, params);
            return rows as any[];
        } catch (error) {
            Logger.logError('Test database query failed', error as Error);
            throw error;
        }
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