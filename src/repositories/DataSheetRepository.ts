import { DatasheetsModel, DatasheetsModelFieldEnum, DatasheetsSaveModel, getDatasheetsFieldType, RepositoryWithBase } from "../interfaces/database";
import BaseRepository from "./BaseRepository";
import { TableEnum } from "../interfaces/enums/index";

class DataSheetRepository implements RepositoryWithBase<DatasheetsModel, DatasheetsSaveModel, typeof DatasheetsModelFieldEnum> {
    public readonly baseRepository: BaseRepository<DatasheetsModel, DatasheetsSaveModel, typeof DatasheetsModelFieldEnum>;

    constructor() {
        this.baseRepository = new BaseRepository<DatasheetsModel, DatasheetsSaveModel, typeof DatasheetsModelFieldEnum>(
            TableEnum.DATASHEETS, 
            DatasheetsModelFieldEnum, 
            getDatasheetsFieldType
        );
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