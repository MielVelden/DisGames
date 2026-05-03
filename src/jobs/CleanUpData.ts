import { JobModule } from "../interfaces/application/Job";
import { StoredProcedureEnum } from "../interfaces/enums";
import Logger from "../utils/application/Logger";
import { RepositoryUtils } from "../repositories/BaseRepository";

export default {
    id: 'cleanup-data',
    name: 'Cleanup Data',
    description: 'Cleanup data',
    isEnabled: true,
    cronExpression: '0 0 2 * * *',

    handler: async (progress): Promise<void> => {
        const result = await RepositoryUtils.CallStoredProcedureGeneric(StoredProcedureEnum.CleanUpData, []);
        Logger.logDebug(`Result: ${result}`);
    }
} as JobModule;