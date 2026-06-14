import Logger from './Logger';
import { closeConnectionAsync } from '../../repositories/util/ConnectionHandler';
import { JobScheduler } from '../../services/application/JobScheduler';
import { EnvConfigEnum } from '../../interfaces/enums/application/EnvConfigEnum';
import { getConfigValue } from './Config';

let _standby = process.argv.includes('--standby');

export function isStandby(): boolean {
    return _standby;
}

export function activate(): void {
    _standby = false;
}

export async function gracefulShutdown(reason: string): Promise<void> {
    await Logger.logInfo(`Shutting down: ${reason}`, {
        sendToDiscord: getConfigValue(EnvConfigEnum.IS_PRODUCTION)
    });

    try {
        await JobScheduler.getInstance().shutdown();
    } catch { }

    try {
        await closeConnectionAsync();
    } catch { }

    process.exit(0);
}
