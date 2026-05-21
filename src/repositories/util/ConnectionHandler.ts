import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { AsyncLocalStorage } from 'async_hooks';
import { TableEnum } from '../../interfaces/enums/database/TableEnum';
import { URL } from 'url';
import Logger from '../../utils/application/Logger';
import { ExceptionEnum } from '../../interfaces/enums';
import { ErrorHelper } from '../../utils/application/Error';
import { getConfigValue } from '../../utils/application/Config';
import { EnvConfigEnum } from '../../interfaces/enums/application/EnvConfigEnum';
import { WebhookType } from '../../interfaces/application';

dotenv.config();

let pool: mysql.Pool | null = null;
let table_enums: Array<{ Id: number, TableName: string }> = [];

export type TransactionHandle = {
    connection: mysql.PoolConnection;
};

const transactionStorage = new AsyncLocalStorage<TransactionHandle>();

function ambientTx(): TransactionHandle | undefined {
    return transactionStorage.getStore();
}

export async function runInTransactionAsync<T>(tx: TransactionHandle, fn: () => Promise<T>): Promise<T> {
    return transactionStorage.run(tx, fn);
}

function createPoolFromConfig(url: URL, dbName: string): mysql.Pool {
    return mysql.createPool({
        host: url.hostname,
        user: url.username,
        database: dbName,
        password: url.password,
        port: Number(url.port) || 3306,
        multipleStatements: true,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
    });
}

function isRecoverableConnectionError(err: unknown): boolean {
    const e = err as { code?: string; errno?: number; message?: string };
    if (!e)
        return false;
    const codes = ['PROTOCOL_CONNECTION_LOST', 'ECONNRESET', 'ETIMEDOUT', 'EPIPE', 'EHOSTUNREACH', 'ECONNREFUSED'];
    if (e.code && codes.includes(e.code))
        return true;
    if (e.errno === 2006 || e.errno === 2013)
        return true;
    if (typeof e.message === 'string') {
        const msg = e.message.toLowerCase();
        const recoverablePhrases = [
            'server has gone away',
            'closed state',
            "connection is closed",
            'connection lost',
            'socket hang up',
        ];
        if (recoverablePhrases.some((p) => msg.includes(p)))
            return true;
    }
    return false;
}

async function loadTableEnumsAsync(): Promise<void> {
    if (!pool)
        ErrorHelper.throw(ExceptionEnum.DATABASE_CONNECTION_FAILED);
    const [rows] = await pool.query('SELECT * FROM table_enums');
    table_enums = rows as Array<{ Id: number, TableName: string }>;
}

async function rebuildPoolAsync(): Promise<void> {
    const dbUrl = getConfigValue(EnvConfigEnum.DATABASE_URL) as string;
    if (!dbUrl)
        ErrorHelper.throwWithParameters(ExceptionEnum.ENV_VARIABLE_NOT_SET, { environmentVariable: 'DATABASE_URL' });
    if (pool) {
        try {
            await pool.end();
        } catch {
        }
        pool = null;
    }
    const url = new URL(dbUrl);
    const dbName = url.pathname.replace(/^\//, '');
    pool = createPoolFromConfig(url, dbName);
    await loadTableEnumsAsync();
}

function ensurePool(): mysql.Pool {
    if (!pool)
        ErrorHelper.throw(ExceptionEnum.DATABASE_CONNECTION_FAILED);
    return pool;
}

//#region Connection Functions

export async function createConnectionAsync(): Promise<boolean> {
    try {
        const dbUrl = getConfigValue(EnvConfigEnum.DATABASE_URL) as string;

        if (!dbUrl)
            ErrorHelper.throwWithParameters(ExceptionEnum.ENV_VARIABLE_NOT_SET, { environmentVariable: 'DATABASE_URL' });

        const url = new URL(dbUrl);
        const dbName = url.pathname.replace(/^\//, '');

        pool = createPoolFromConfig(url, dbName);

        await loadTableEnumsAsync();
        return true;
    } catch (err) {
        Logger.logError(`Failed to connect to database`, err as Error);
        ErrorHelper.wrap(err, ExceptionEnum.DATABASE_CONNECTION_FAILED);
    }
}

export async function closeConnectionAsync(): Promise<void> {
    if (pool) {
        await pool.end();
        pool = null;
    }
}

export async function validateConnectionAsync(): Promise<boolean> {
    const activePool = ensurePool();
    let conn: mysql.PoolConnection | null = null;
    try {
        conn = await activePool.getConnection();
        await conn.ping();
        return true;
    } catch (err) {
        if (!isRecoverableConnectionError(err))
            ErrorHelper.wrap(err, ExceptionEnum.DATABASE_CONNECTION_FAILED);
        Logger.logError('Database ping failed, rebuilding pool', err as Error);
        await rebuildPoolAsync();
        return true;
    } finally {
        if (conn)
            conn.release();
    }
}

//#endregion

//#region Query Functions

type Runner = (sql: string, params?: any[]) => Promise<[any, any]>;

async function runWithRetry(
    runner: (executor: Runner) => Promise<any[]>,
    tx?: TransactionHandle,
): Promise<any[] | undefined> {
    const activePool = ensurePool();
    const activeTx = tx ?? ambientTx();
    const executor: Runner = activeTx
        ? (sql, params) => activeTx.connection.query(sql, params) as Promise<[any, any]>
        : (sql, params) => activePool.query(sql, params) as Promise<[any, any]>;

    try {
        return await runner(executor);
    } catch (err) {
        if (!activeTx && isRecoverableConnectionError(err)) {
            Logger.logError('Database connection lost, rebuilding pool', err as Error, {
                webhookType: WebhookType.DEBUG,
                sendToDiscord: true
            });
            try {
                await rebuildPoolAsync();
                const retryPool = ensurePool();
                const retryExecutor: Runner = (sql, params) =>
                    retryPool.query(sql, params) as Promise<[any, any]>;
                return await runner(retryExecutor);
            } catch (retryErr) {
                Logger.logError(`Error while running database query`, retryErr as Error, { sendToDiscord: true });
                ErrorHelper.wrap(retryErr, ExceptionEnum.DATABASE_CONNECTION_FAILED);
            }
        }
        Logger.logError(`Error while running database query`, err as Error, { sendToDiscord: true });
        ErrorHelper.wrap(err, ExceptionEnum.DATABASE_CONNECTION_FAILED);
    }
}

export async function runQueryAsync(query: string, params?: any[], tx?: TransactionHandle): Promise<any[] | undefined> {
    return runWithRetry(async (executor) => {
        if (Logger.isDebugEnabled())
            Logger.logDebug(() => params ? `Running query: ${query} with params ${params}` : `Running query: ${query}`);
        const [rows] = await executor(query, params);
        return rows as any[];
    }, tx);
}

// MySQL's prepared-statement protocol (used by .execute()) rejects parameterized
// LIMIT/OFFSET on versions older than 8.0.23. mysql2's text protocol (.query()) handles
// them universally, so we route those queries there automatically.
function requiresTextProtocol(sql: string): boolean {
    return /\s(LIMIT|OFFSET)\s*\?/i.test(sql);
}

export async function runExecuteAsync(query: string, params?: any[], tx?: TransactionHandle): Promise<any[] | undefined> {
    if (requiresTextProtocol(query))
        return runQueryAsync(query, params, tx);

    const activePool = ensurePool();
    const activeTx = tx ?? ambientTx();
    const executor: Runner = activeTx
        ? (sql, p) => activeTx.connection.execute(sql, p) as Promise<[any, any]>
        : (sql, p) => activePool.execute(sql, p) as Promise<[any, any]>;

    try {
        if (Logger.isDebugEnabled())
            Logger.logDebug(() => params ? `Running execute: ${query} with params ${params}` : `Running execute: ${query}`);
        const [rows] = await executor(query, params);
        return rows as any[];
    } catch (err) {
        if (!activeTx && isRecoverableConnectionError(err)) {
            Logger.logError('Database connection lost during execute, rebuilding pool', err as Error, {
                webhookType: WebhookType.DEBUG,
                sendToDiscord: true
            });
            try {
                await rebuildPoolAsync();
                const retryPool = ensurePool();
                const [rows] = await retryPool.execute(query, params);
                return rows as any[];
            } catch (retryErr) {
                Logger.logError(`Error while running database execute`, retryErr as Error, { sendToDiscord: true });
                ErrorHelper.wrap(retryErr, ExceptionEnum.DATABASE_CONNECTION_FAILED);
            }
        }
        Logger.logError(`Error while running database execute`, err as Error, { sendToDiscord: true });
        ErrorHelper.wrap(err, ExceptionEnum.DATABASE_CONNECTION_FAILED);
    }
}

//#region Transaction Functions

export async function startTransactionAsync(): Promise<TransactionHandle> {
    const activePool = ensurePool();
    let conn: mysql.PoolConnection;
    try {
        conn = await activePool.getConnection();
    } catch (err) {
        if (!isRecoverableConnectionError(err))
            ErrorHelper.wrap(err, ExceptionEnum.DATABASE_CONNECTION_FAILED);
        Logger.logError('Database connection lost at transaction start, rebuilding pool', err as Error);
        await rebuildPoolAsync();
        conn = await ensurePool().getConnection();
    }

    try {
        await conn.beginTransaction();
    } catch (err) {
        conn.release();
        ErrorHelper.wrap(err, ExceptionEnum.DATABASE_CONNECTION_FAILED);
    }

    return { connection: conn };
}

export async function rollbackTransactionAsync(tx: TransactionHandle): Promise<void> {
    try {
        await tx.connection.rollback();
    } catch (err) {
        ErrorHelper.wrap(err, ExceptionEnum.DATABASE_CONNECTION_FAILED);
    } finally {
        tx.connection.release();
    }
}

export async function commitTransactionAsync(tx: TransactionHandle): Promise<void> {
    try {
        await tx.connection.commit();
    } catch (err) {
        ErrorHelper.wrap(err, ExceptionEnum.DATABASE_CONNECTION_FAILED);
    } finally {
        tx.connection.release();
    }
}

//#endregion

//#region Table Enums

export function getDatabaseName(): string {
    const dbUrl = getConfigValue(EnvConfigEnum.DATABASE_URL) as string;
    if (!dbUrl)
        ErrorHelper.throwWithParameters(ExceptionEnum.ENV_VARIABLE_NOT_SET, { environmentVariable: 'DATABASE_URL' });
    const url = new URL(dbUrl);
    return url.pathname.replace(/^\//, '');
}

export function getTableName(tableEnumValue: TableEnum): string {
    const enumValue = table_enums.find(tableEnum => tableEnum.Id === tableEnumValue)?.TableName;
    if (!enumValue) {
        const enumObject = Object.keys(TableEnum) as Array<keyof typeof TableEnum>;
        const enumValue = enumObject.find(enumValue => TableEnum[enumValue] === tableEnumValue)?.toLowerCase();
        if (enumValue)
            return enumValue;
        else
            ErrorHelper.throwWithParameters(ExceptionEnum.TABLE_ENUM_NOT_FOUND, { tableEnumValue: tableEnumValue.toString() });
    }
    return enumValue;
}

//#endregion

//#region Test Helpers (internal)

export function _getPoolForTests(): mysql.Pool | null {
    return pool;
}

//#endregion
