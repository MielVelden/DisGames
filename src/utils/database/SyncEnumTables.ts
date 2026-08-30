import '../../interfaces/enums';
import { EnumType } from '../../interfaces/application/EnumType';
import { getEnumTableRegistry } from '../helpers/EnumMetadata';
import { runQueryAsync, getDatabaseName } from '../../repositories/util/ConnectionHandler';
import Logger from '../application/Logger';

type EnumTableRow = { Id: number; Name: string };

function getEnumEntries(enumObject: EnumType): EnumTableRow[] {
    return Object.entries(enumObject)
        .filter(([, value]) => typeof value === 'number')
        .map(([name, value]) => ({ Id: value as number, Name: name }));
}

async function syncSingleEnumTableAsync(tableName: string, enumObject: EnumType): Promise<void> {
    await runQueryAsync(`
        CREATE TABLE IF NOT EXISTS \`${tableName}\` (
            Id INT PRIMARY KEY,
            Name VARCHAR(255) NOT NULL
        )
    `);

    const expectedRows = getEnumEntries(enumObject);
    const expectedById = new Map(expectedRows.map(row => [row.Id, row.Name]));

    const existingRows = await runQueryAsync(`SELECT Id, Name FROM \`${tableName}\``) as EnumTableRow[];

    const staleIds = new Set(
        existingRows
            .filter(row => expectedById.get(row.Id) !== row.Name)
            .map(row => row.Id)
    );

    if (staleIds.size > 0) {
        await runQueryAsync(
            `DELETE FROM \`${tableName}\` WHERE Id IN (${Array.from(staleIds).map(() => '?').join(', ')})`,
            Array.from(staleIds)
        );
    }

    const existingIds = new Set(existingRows.map(row => row.Id));
    const missingRows = expectedRows.filter(row => !existingIds.has(row.Id) || staleIds.has(row.Id));

    for (const row of missingRows)
        await runQueryAsync(`INSERT INTO \`${tableName}\` (Id, Name) VALUES (?, ?)`, [row.Id, row.Name]);

    Logger.logInfo(`Synced enum table '${tableName}' (${expectedRows.length} rows)`);
}

async function dropOrphanedEnumTablesAsync(knownTableNames: Set<string>): Promise<void> {
    const rows = await runQueryAsync(`
        SELECT table_name AS TABLE_NAME
        FROM information_schema.tables
        WHERE table_schema = ?
        AND table_name LIKE '%\\_enum'
    `, [getDatabaseName()]) as Array<{ TABLE_NAME: string }>;

    for (const row of rows) {
        const tableName = row.TABLE_NAME;
        if (knownTableNames.has(tableName))
            continue;

        try {
            await runQueryAsync(`DROP TABLE \`${tableName}\``);
            Logger.logInfo(`Dropped orphaned enum table '${tableName}'`);
        } catch (err) {
            Logger.logError(`Could not drop orphaned enum table '${tableName}'`, err as Error, { sendToDiscord: true });
        }
    }
}

export async function syncEnumTablesAsync(): Promise<void> {
    const registry = getEnumTableRegistry();

    for (const [enumObject, tableName] of registry)
        await syncSingleEnumTableAsync(tableName, enumObject);

    await dropOrphanedEnumTablesAsync(new Set(registry.values()));
}
