import { DatasheetsModel, DatasheetsSaveModel } from "../interfaces/database";
import BaseRepository from "./BaseRepository";
import { TableEnum } from "../interfaces/enums/index";

class DataSheetRepository {
    private baseRepository: BaseRepository<DatasheetsModel, DatasheetsSaveModel>;

    constructor() {
        this.baseRepository = new BaseRepository<DatasheetsModel, DatasheetsSaveModel>(TableEnum.DATASHEETS);
    }

    async getAllDataSheetsAsync(): Promise<DatasheetsModel[]> {
        return this.baseRepository.Select().Execute();
    }

    async getDataSheetByIdAsync(id: number): Promise<DatasheetsModel> {
        const model = await this.baseRepository.Select().Where({ Id: id }).Limit(1).Execute();
        return model[0];
    }

    async save(model: DatasheetsSaveModel): Promise<DatasheetsModel> {
        return this.baseRepository.Save(model);
    }
}

export default new DataSheetRepository();