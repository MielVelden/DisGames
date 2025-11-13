import { InteractionEvent } from "../../interfaces/application";
import { DebugModel, DebugModelFieldEnum, DebugSaveModel } from "../../interfaces/database/TableInterfaces";
import { ExceptionEnum } from "../../interfaces/enums/application/ExpectionEnum";
import DebugRepository from "../../repositories/DebugRepository";
import { ErrorHelper } from "../../utils/application/Error";
import { UniqueCodes } from "../../utils/helpers/UniqueCodes";
import { BaseDomainService } from "./BaseDomainService";

class DebugService extends BaseDomainService<DebugModel, DebugSaveModel, typeof DebugRepository> {
    protected readonly repository = DebugRepository;

    public async getAllAsync(): Promise<DebugModel[]> {
        return await this.repository.getAllAsync();
    }

    protected async performSaveAsync(savable: DebugSaveModel, event: InteractionEvent): Promise<DebugModel> {
        if (savable.isUpdate()) {
            const debugRecord = await this.repository.getByIdAsync(savable.getId()!);
            if (!debugRecord)
                ErrorHelper.throw(ExceptionEnum.RECORD_NOT_FOUND);

            savable.Id = debugRecord.Id;
            savable.validateHasNotChanged(DebugModelFieldEnum.UniqueCode, debugRecord.UniqueCode);

            return await this.repository.saveAsync(savable);
        } else {
            savable.validateIsNotNull(DebugModelFieldEnum.ServerId);
            savable.validateIsNotNull(DebugModelFieldEnum.Data);
            savable.validateIsNull(DebugModelFieldEnum.UniqueCode);
            savable.UniqueCode = UniqueCodes.generateUUID();
            return await this.repository.saveAsync(savable);
        }
    }

    public async purgeAsync(id: number): Promise<void> {
        await this.repository.purgeAsync(id);
    }
}

export default new DebugService();