import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';
import mysql from 'mysql2/promise';
import { URL } from 'url';
import { createConnectionAsync, closeConnectionAsync } from './repositories/util/ConnectionHandler';
import { syncRoutines } from './utils/routines/Sync';
import { syncEnumTablesAsync } from './utils/database/SyncEnumTables';
import Logger from './utils/application/Logger';
import { getConfig, getConfigValue } from './utils/application/Config';
import { EnvConfigEnum } from './interfaces/enums/application/EnvConfigEnum';
import TestMode from './utils/application/TestMode';

// Bootstrapping a DB is only ever done for a test database (CI or local), where
// just the test-mode-required env vars are set — not the full production schema.
TestMode.enable();
getConfig();

const schemaFilePath = path.join(__dirname, 'db', 'schema', 'schema.sql');

// Runs ahead of ConnectionHandler's pool: createConnectionAsync() queries `table_enum`
// as soon as it connects, so the database + schema must already exist by then.
async function createDatabaseAndApplySchemaAsync(): Promise<void> {
    const dbUrl = getConfigValue(EnvConfigEnum.DATABASE_URL) as string;
    const url = new URL(dbUrl);
    const dbName = url.pathname.replace(/^\//, '');

    const connection = await mysql.createConnection({
        host: url.hostname,
        user: url.username,
        password: url.password,
        port: Number(url.port) || 3306,
        multipleStatements: true,
    });
    try {
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
        await connection.query(`USE \`${dbName}\``);
        Logger.logInfo(`Database '${dbName}' ready`);

        const schemaSql = fs.readFileSync(schemaFilePath, 'utf-8');
        await connection.query(schemaSql);
        Logger.logInfo(`Applied schema from ${schemaFilePath}`);
    } finally {
        await connection.end();
    }
}

async function runAsync(): Promise<void> {
    try {
        await createDatabaseAndApplySchemaAsync();
        await createConnectionAsync();
        await syncRoutines();
        await syncEnumTablesAsync();
        Logger.logInfo('Database bootstrap complete');
    } catch (err) {
        Logger.logError(`Error bootstrapping database: ${err}`);
        process.exitCode = 1;
    } finally {
        await closeConnectionAsync();
    }
}

if (require.main === module) {
    runAsync().catch(console.error);
}
