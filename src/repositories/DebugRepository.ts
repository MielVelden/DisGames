import { DebugModel, DebugModelFieldEnum, DebugSaveModel, getDebugFieldType } from "../interfaces/database/TableInterfaces";
import { RepositoryWithBase } from "../interfaces/database/Repository";
import BaseRepository from "./BaseRepository";
import { TableEnum } from "../interfaces/enums/index";

class DebugRepository implements RepositoryWithBase<DebugModel, DebugSaveModel, typeof DebugModelFieldEnum> {
    public readonly baseRepository: BaseRepository<DebugModel, DebugSaveModel, typeof DebugModelFieldEnum>;

    constructor() {
        this.baseRepository = new BaseRepository<DebugModel, DebugSaveModel, typeof DebugModelFieldEnum>(
            TableEnum.DEBUG, 
            DebugModelFieldEnum, 
            getDebugFieldType
        );
    }

    async getByIdAsync(id: number): Promise<DebugModel | null> {
        return this.baseRepository.getById(id);
    }

    async getByUniqueCodeAsync(uniqueCode: string, isEmpty: boolean = false): Promise<DebugModel | null> {
        const model = await this.baseRepository.Select().Where({ UniqueCode: uniqueCode }).Limit(1).Execute();
        if (!model || model.length === 0 || (isEmpty && model[0].UpdatedAt !== null))
            return null;

        return model[0];
    }

    async getAllAsync(): Promise<DebugModel[]> {
        return this.baseRepository.Select().Execute();
    }

    async saveAsync(model: DebugSaveModel): Promise<DebugModel> {
        return this.baseRepository.Save(model);
    }

    async purgeAsync(id: number): Promise<void> {
        await this.baseRepository.Delete(id);
    }
}

export default new DebugRepository();