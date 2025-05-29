import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { TableEnum } from '../../interfaces/enums/database/TableEnum';

dotenv.config();

let pool: mysql.Pool | null = null;
let connection: mysql.Connection | null = null;
let table_enums: Array<{ Id: number, TableName: string }> = [];

export async function createConnectionAsync(): Promise<void> {
    try {
        pool = mysql.createPool({
            host: process.env.DB_HOST as string,
            user: process.env.DB_USER as string,
            database: process.env.DB_NAME as string,
            password: process.env.DB_PASSWORD as string,
            port: Number(process.env.DB_PORT) || 3306,
        });
        connection = await pool.getConnection();
    } catch (err) {
        throw new Error(`Failed to connect to database: ${err}`);
    }

    await getTableEnumsAsync();
}

export async function runQueryAsync(query: string, params?: any[]): Promise<any[] | undefined> {
    try {
        if (!connection) {
            throw new Error('Database connection not established');
        }

        const [rows] = await pool!.execute(query, params);
        return rows as any[];
    } catch (err) {
        console.log('Query:', query);
        console.log('Parameters:', params);
        console.error('Error while running database query:', err);
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
    if (!enumValue)
        throw new Error(`Table enum ${tableEnumValue} not found`);

    return enumValue;
}

function getTableEnum(tableName: string): { Id: number, TableName: string } | undefined {
    return table_enums.find(tableEnum => tableEnum.TableName === tableName);
}

//#endregion
