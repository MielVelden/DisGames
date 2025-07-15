import { DatasheetsModel, DatasheetsSaveModel } from "../interfaces/database";
import { Repository } from "../interfaces/database";
import BaseRepository from "./BaseRepository";
import { TableEnum } from "../interfaces/enums/index";

class DataSheetRepository implements Repository<DatasheetsModel> {
    private baseRepository: BaseRepository<DatasheetsModel, DatasheetsSaveModel>;

    constructor() {
        this.baseRepository = new BaseRepository<DatasheetsModel, DatasheetsSaveModel>(TableEnum.DATASHEETS);
    }

    async getByIDAsync(id: number): Promise<DatasheetsModel | null> {
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