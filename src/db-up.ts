import 'reflect-metadata';
import { createConnectionAsync, closeConnectionAsync } from './repositories/util/ConnectionHandler';
import { syncRoutines } from './utils/routines/Sync';
import { syncEnumTablesAsync } from './utils/database/SyncEnumTables';
import Logger from './utils/application/Logger';
import { getConfig } from './utils/application/Config';

getConfig();

export async function syncRoutinesAsync() {
    try {
        await createConnectionAsync();
        await syncRoutines();
        await syncEnumTablesAsync();
    } catch (err) {
        Logger.logError(`Error syncing routines: ${err}`);
    } finally {
        await closeConnectionAsync();
    }
}

if (require.main === module) {
    syncRoutinesAsync().catch(console.error);
}
