import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
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
let connection: mysql.PoolConnection | null = null;
let table_enums: Array<{ Id: number, TableName: string }> = [];
let inTransaction = false;

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

async function releaseHeldConnectionAsync(): Promise<void> {
    if (!connection)
        return;
    const c = connection;
    connection = null;
    try {
        c.destroy();
    } catch {
        try {
            c.release();
        } catch {
        }
    }
}

async function loadTableEnumsAsync(): Promise<void> {
    if (!connection)
        ErrorHelper.throw(ExceptionEnum.DATABASE_CONNECTION_FAILED);
    const query = 'SELECT * FROM table_enums';
    const [rows] = await connection.query(query);
    table_enums = rows as Array<{ Id: number, TableName: string }>;
}

async function rebuildPoolAsync(): Promise<void> {
    const dbUrl = getConfigValue(EnvConfigEnum.DATABASE_URL) as string;
    if (!dbUrl)
        ErrorHelper.throwWithParameters(ExceptionEnum.ENV_VARIABLE_NOT_SET, { environmentVariable: 'DATABASE_URL' });
    await releaseHeldConnectionAsync();
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
    connection = await pool.getConnection();
    await loadTableEnumsAsync();
}

async function reconnectAfterConnectionLossAsync(): Promise<void> {
    await releaseHeldConnectionAsync();
    if (!pool) {
        await rebuildPoolAsync();
        return;
    }
    try {
        connection = await pool.getConnection();
        await loadTableEnumsAsync();
    } catch (err) {
        Logger.logError('Failed to get database connection from pool after loss, rebuilding pool', err as Error);
        await rebuildPoolAsync();
    }
}

async function ensureConnectionAsync(): Promise<void> {
    if (connection)
        return;
    if (!pool)
        ErrorHelper.throw(ExceptionEnum.DATABASE_CONNECTION_FAILED);
    try {
        connection = await pool.getConnection();
    } catch (err) {
        Logger.logError('Failed to acquire database connection', err as Error);
        await rebuildPoolAsync();
    }
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

        connection = await pool.getConnection();
        await loadTableEnumsAsync();
        return true;
    } catch (err) {
        Logger.logError(`Failed to connect to database`, err as Error);
        ErrorHelper.wrap(err, ExceptionEnum.DATABASE_CONNECTION_FAILED);
    }
}

export async function closeConnectionAsync(): Promise<void> {
    inTransaction = false;
    await releaseHeldConnectionAsync();

    if (pool) {
        await pool.end();
        pool = null;
    }
}

export async function validateConnectionAsync(): Promise<boolean> {
    await ensureConnectionAsync();
    if (!connection)
        ErrorHelper.throw(ExceptionEnum.DATABASE_CONNECTION_FAILED);
    try {
        await connection.ping();
        return true;
    } catch (err) {
        if (!isRecoverableConnectionError(err))
            ErrorHelper.wrap(err, ExceptionEnum.DATABASE_CONNECTION_FAILED);
        Logger.logError('Database ping failed, reconnecting', err as Error);
        await reconnectAfterConnectionLossAsync();
        return true;
    }
}

//#endregion

//#region Query Functions

export async function runQueryAsync(query: string, params?: any[]): Promise<any[] | undefined> {
    await ensureConnectionAsync();
    if (!connection)
        ErrorHelper.throw(ExceptionEnum.DATABASE_CONNECTION_FAILED);

    const execute = async () => {
        Logger.logDebug(params ? `Running query: ${query} with params ${params}` : `Running query: ${query}`);
        const [rows] = await connection!.query(query, params);
        return rows as any[];
    };

    try {
        return await execute();
    } catch (err) {
        if (!inTransaction && isRecoverableConnectionError(err)) {
            Logger.logError('Database connection lost, reconnecting', err as Error, {
                webhookType: WebhookType.DEBUG,
                sendToDiscord: true
            });

            await reconnectAfterConnectionLossAsync();
            try {
                return await execute();
            } catch (retryErr) {
                Logger.logError(`Error while running database query`, retryErr as Error);
                ErrorHelper.wrap(retryErr, ExceptionEnum.DATABASE_CONNECTION_FAILED);
            }
        }
        Logger.logError(`Error while running database query`, err as Error);
        ErrorHelper.wrap(err, ExceptionEnum.DATABASE_CONNECTION_FAILED);
    }
}

//#region Transaction Functions

export async function startTransactionAsync(): Promise<void> {
    await ensureConnectionAsync();
    if (!connection)
        ErrorHelper.throw(ExceptionEnum.DATABASE_CONNECTION_FAILED);
    try {
        await connection.beginTransaction();
    } catch (err) {
        if (!isRecoverableConnectionError(err))
            ErrorHelper.wrap(err, ExceptionEnum.DATABASE_CONNECTION_FAILED);
        Logger.logError('Database connection lost at transaction start, reconnecting', err as Error);
        await reconnectAfterConnectionLossAsync();
        if (!connection)
            ErrorHelper.throw(ExceptionEnum.DATABASE_CONNECTION_FAILED);
        try {
            await connection.beginTransaction();
        } catch (retryErr) {
            ErrorHelper.wrap(retryErr, ExceptionEnum.DATABASE_CONNECTION_FAILED);
        }
    }
    inTransaction = true;
}

export async function rollbackTransactionAsync(): Promise<void> {
    if (!connection) {
        inTransaction = false;
        ErrorHelper.throw(ExceptionEnum.DATABASE_CONNECTION_FAILED);
    }
    try {
        await connection.rollback();
    } catch (err) {
        ErrorHelper.wrap(err, ExceptionEnum.DATABASE_CONNECTION_FAILED);
    } finally {
        inTransaction = false;
    }
}

export async function commitTransactionAsync(): Promise<void> {
    if (!connection) {
        inTransaction = false;
        ErrorHelper.throw(ExceptionEnum.DATABASE_CONNECTION_FAILED);
    }
    try {
        await connection.commit();
    } catch (err) {
        ErrorHelper.wrap(err, ExceptionEnum.DATABASE_CONNECTION_FAILED);
    } finally {
        inTransaction = false;
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
