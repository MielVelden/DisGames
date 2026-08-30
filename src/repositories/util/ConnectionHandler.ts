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
let table_enum: Array<{ Id: number, Name: string }> = [];

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
        charset: 'utf8mb4',
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
    const [rows] = await pool.query('SELECT * FROM table_enum');
    table_enum = rows as Array<{ Id: number, Name: string }>;
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

type RunMode = 'query' | 'execute';
type Runner = (sql: string, params?: any[]) => Promise<[any, any]>;

function executorFor(mode: RunMode, pool: mysql.Pool, tx?: TransactionHandle): Runner {
    if (tx)
        return mode === 'execute'
            ? (sql, p) => tx.connection.execute(sql, p) as Promise<[any, any]>
            : (sql, p) => tx.connection.query(sql, p) as Promise<[any, any]>;
    return mode === 'execute'
        ? (sql, p) => pool.execute(sql, p) as Promise<[any, any]>
        : (sql, p) => pool.query(sql, p) as Promise<[any, any]>;
}

async function runWithRetry(
    mode: RunMode,
    sql: string,
    params?: any[],
    tx?: TransactionHandle,
): Promise<any[] | undefined> {
    const activeTx = tx ?? ambientTx();
    const label = mode === 'execute' ? 'execute' : 'query';

    Logger.logDebug(() => params ? `Running ${label}: ${sql} with params ${params}` : `Running ${label}: ${sql}`);

    const runOnce = async (pool: mysql.Pool): Promise<any[]> => {
        const exec = executorFor(mode, pool, activeTx);
        const [rows] = await exec(sql, params);
        return rows as any[];
    };

    try {
        return await runOnce(ensurePool());
    } catch (err) {
        if (!activeTx && isRecoverableConnectionError(err)) {
            Logger.logError(`Database connection lost during ${label}, rebuilding pool`, err as Error, {
                webhookType: WebhookType.DEBUG,
                sendToDiscord: true,
            });
            try {
                await rebuildPoolAsync();
                return await runOnce(ensurePool());
            } catch (retryErr) {
                Logger.logError(`Error while running database ${label}`, retryErr as Error, { sendToDiscord: true });
                ErrorHelper.wrap(retryErr, ExceptionEnum.DATABASE_CONNECTION_FAILED);
            }
        }
        Logger.logError(`Error while running database ${label}`, err as Error, { sendToDiscord: true });
        ErrorHelper.wrap(err, ExceptionEnum.DATABASE_CONNECTION_FAILED);
    }
}

function requiresTextProtocol(sql: string): boolean {
    // MySQL's prepared-statement protocol (used by .execute()) rejects parameterized
    // LIMIT/OFFSET on versions older than 8.0.23. mysql2's text protocol (.query())
    // handles them universally, so route those queries there automatically.
    return /\s(LIMIT|OFFSET)\s*\?/i.test(sql);
}

export async function runQueryAsync(query: string, params?: any[], tx?: TransactionHandle): Promise<any[] | undefined> {
    return runWithRetry('query', query, params, tx);
}

export async function runExecuteAsync(query: string, params?: any[], tx?: TransactionHandle): Promise<any[] | undefined> {
    if (requiresTextProtocol(query))
        return runWithRetry('query', query, params, tx);
    return runWithRetry('execute', query, params, tx);
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
        try {
            await rebuildPoolAsync();
            conn = await ensurePool().getConnection();
        } catch (retryErr) {
            ErrorHelper.wrap(retryErr, ExceptionEnum.DATABASE_CONNECTION_FAILED);
        }
    }

    try {
        await conn!.beginTransaction();
    } catch (err) {
        conn!.release();
        ErrorHelper.wrap(err, ExceptionEnum.DATABASE_CONNECTION_FAILED);
    }

    return { connection: conn! };
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
    const enumValue = table_enum.find(row => row.Id === tableEnumValue)?.Name.toLowerCase();
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

