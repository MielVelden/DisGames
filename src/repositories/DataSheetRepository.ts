import { DatasheetsModel, DatasheetsModelFieldEnum, DatasheetsSaveModel, RepositoryWithBase } from "../interfaces/database";
import BaseRepository from "./BaseRepository";
import { TableEnum } from "../interfaces/enums/index";

class DataSheetRepository implements RepositoryWithBase<DatasheetsModel, DatasheetsSaveModel> {
    public readonly baseRepository: BaseRepository<DatasheetsModel, DatasheetsSaveModel>;

    constructor() {
        this.baseRepository = new BaseRepository<DatasheetsModel, DatasheetsSaveModel>(TableEnum.DATASHEETS, DatasheetsModelFieldEnum);
    }

    async getByIdAsync(id: number): Promise<DatasheetsModel | null> {
        return this.baseRepository.getById(id);
    }

    async getAllAsync(): Promise<DatasheetsModel[]> {
        return this.baseRepository.Select().Execute();
    }

    async saveAsync(model: DatasheetsSaveModel): Promise<DatasheetsModel> {
        return this.baseRepository.Save(model);
    }

    async purgeAsync(id: number): Promise<void> {
        await this.baseRepository.Delete(id);
    }
}

export default new DataSheetRepository();