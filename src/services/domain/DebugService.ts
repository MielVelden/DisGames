import { DebugModel } from "../../interfaces/database/TableInterfaces";
import DebugRepository from "../../repositories/DebugRepository";
import Logger from "../../utils/Logger";
import { UniqueCodeGenerator } from "../../utils/UniqueCodeGenerator";

class DebugService {
    public async getDebugById(id: number): Promise<DebugModel> {
        const debugRecord = await DebugRepository.getByIDAsync(id);
        if (!debugRecord)
            throw new Error("Debug not found");

        return debugRecord;
    }

    public async createNewDebugRecord(): Promise<DebugModel> {
        const debugRecord = await DebugRepository.saveAsync({
            UniqueCode: UniqueCodeGenerator.generateUUID(),
            CreatedAt: new Date(),
        });

        Logger.logDebug(`Debug record created: ${debugRecord.UniqueCode}`);
        return debugRecord;
    }

    public async getDebugByUniqueCode(uniqueCode: string): Promise<DebugModel> {
        const debugRecord = await DebugRepository.getByUniqueCode(uniqueCode);
        if (!debugRecord)
            throw new Error("Debug not found");
        return debugRecord;
    }

    public async saveAsync(debugRecord: DebugModel): Promise<DebugModel> {
        debugRecord.UpdatedAt = new Date();
        return await DebugRepository.saveAsync(debugRecord);
    }
}

export default new DebugService();