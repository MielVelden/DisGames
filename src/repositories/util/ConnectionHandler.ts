import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { TableEnum } from '../../interfaces/enums/database/TableEnum';
import { URL } from 'url';
import Logger from '../../utils/Logger';

dotenv.config();

let pool: mysql.Pool | null = null;
let connection: mysql.PoolConnection | null = null;
let table_enums: Array<{ Id: number, TableName: string }> = [];

//#region Connection Functions

export async function createConnectionAsync(): Promise<boolean> {
    try {
        const dbUrl = process.env.DATABASE_URL as string;

        if (!dbUrl)
            throw new Error('DATABASE_URL environment variable is not set');

        const url = new URL(dbUrl);
        const dbName = url.pathname.replace(/^\//, '');

        pool = mysql.createPool({
            host: url.hostname,
            user: url.username,
            database: dbName,
            password: url.password,
            port: Number(url.port) || 3306,
        });

        connection = await pool.getConnection();
        await getTableEnumsAsync();
        return true;
    } catch (err) {
        Logger.logError(`Failed to connect to database`, err as Error);
        throw new Error(`Failed to connect to database`);
    }
}

export async function closeConnectionAsync(): Promise<void> {
    if (connection) {
        connection.release();
        connection = null;
    }

    if (pool) {
        await pool.end();
        pool = null;
    }
}

export async function validateConnectionAsync(): Promise<boolean> {
    if (!connection)
        throw new Error('Database connection not established');
    return true;
}

//#endregion

//#region Query Functions

export async function runQueryAsync(query: string, params?: any[]): Promise<any[] | undefined> {
    try {
        if (!connection)
            throw new Error('Database connection not established');

        Logger.logDebug(params ? `Running query: ${query} with params ${params}` : `Running query: ${query}`);
        const [rows] = await pool!.query(query, params);
        return rows as any[];
    } catch (err) {
        Logger.logError(`Error while running database query`, err as Error);
        throw err;
    }
}

//#region Transaction Functions

export async function startTransactionAsync(): Promise<void> {
    if (!connection)
        throw new Error('Database connection not established');
    await connection.beginTransaction();
}

export async function rollbackTransactionAsync(): Promise<void> {
    if (!connection)
        throw new Error('Database connection not established');
    await connection.rollback();
}

export async function commitTransactionAsync(): Promise<void> {
    if (!connection)
        throw new Error('Database connection not established');
    await connection.commit();
}

//#endregion

//#region Table Enums

async function getTableEnumsAsync(): Promise<void> {
    const query = 'SELECT * FROM table_enums';
    const results = await runQueryAsync(query);
    table_enums = results as Array<{ Id: number, TableName: string }>;
}

export function getTableName(tableEnumValue: TableEnum): string {
    const enumValue = table_enums.find(tableEnum => tableEnum.Id === tableEnumValue)?.TableName;
    if (!enumValue) {
        const enumObject = Object.keys(TableEnum) as Array<keyof typeof TableEnum>;
        const enumValue = enumObject.find(enumValue => TableEnum[enumValue] === tableEnumValue)?.toLowerCase();
        if (enumValue)
            return enumValue;
        else
            throw new Error(`Table enum ${tableEnumValue} not found`);
    }
    return enumValue;
}

function getTableEnum(tableName: string): { Id: number, TableName: string } | undefined {
    return table_enums.find(tableEnum => tableEnum.TableName === tableName);
}

//#endregion
