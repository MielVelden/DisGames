import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { TableEnum } from '../../interfaces/enums/database/TableEnum';
import { URL } from 'url';

dotenv.config();

let pool: mysql.Pool | null = null;
let connection: mysql.Connection | null = null;
let table_enums: Array<{ Id: number, TableName: string }> = [];

export async function createConnectionAsync(): Promise<boolean> {
    try {
        const dbUrl = process.env.DATABASE_URL as string;
        
        if (!dbUrl) {
            throw new Error('DATABASE_URL environment variable is not set');
        }
        
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
        throw new Error(`Failed to connect to database: ${err}`);
    }
}
export async function runQueryAsync(query: string, params?: any[]): Promise<any[] | undefined> {
    try {
        if (!connection) {
            throw new Error('Database connection not established');
        }

        const [rows] = await pool!.query(query, params);
        return rows as any[];
    } catch (err) {
        console.log('Query:', query);
        console.log('Parameters:', params);
        console.error('Error while running database query:', err);
        throw err;
    }
}

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
