import { DatasheetsModel, ServersModel } from "../interfaces/database/TableInterfaces";
import { LanguageEnum } from "../interfaces/enums/database/LanguageEnum";
import DataSheetRepository from "../repositories/DataSheetRepository";
import ServerRepository from "../repositories/ServerRepository";

class DataSheetService {
    public async getDataSheetById(id: number): Promise<DatasheetsModel> {
        const dataSheet = DataSheetRepository.getDataSheetByIdAsync(id);
        if (!dataSheet)
            throw new Error("Data sheet not found");

        return dataSheet;
    }
}

export default new DataSheetService();