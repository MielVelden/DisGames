import { DebugModel } from "../../interfaces/database/TableInterfaces";
import { ExceptionEnum } from "../../interfaces/enums/domain/ExpectionEnum";
import DebugRepository from "../../repositories/DebugRepository";
import { ErrorHelper } from "../../utils/application/Error";
import Logger from "../../utils/application/Logger";
import { UniqueCodes } from "../../utils/helpers/UniqueCodes";

class DebugService {
    public async getDebugById(id: number): Promise<DebugModel> {
        const debugRecord = await DebugRepository.getByIDAsync(id);
        if (!debugRecord)
            throw new Error("Debug not found");

        return debugRecord;
    }

    public async createEmptyRecordAsync(): Promise<DebugModel> {
        const debugRecord = await DebugRepository.saveAsync({
            UniqueCode: UniqueCodes.generateUUID(),
            CreatedAt: new Date(),
        });

        Logger.logDebug(`Debug record created: ${debugRecord.UniqueCode}`);
        return debugRecord;
    }

    public async getDebugByUniqueCodeAsync(uniqueCode: string, isEmpty: boolean = false): Promise<DebugModel> {
        const debugRecord = await DebugRepository.getByUniqueCodeAsync(uniqueCode, isEmpty);
        if (!debugRecord)
            ErrorHelper.throw(ExceptionEnum.RECORD_NOT_FOUND);
        return debugRecord;
    }

    public async saveAsync(debugRecord: DebugModel): Promise<DebugModel> {
        debugRecord.UpdatedAt = new Date();
        return await DebugRepository.saveAsync(debugRecord);
    }
}

export default new DebugService();