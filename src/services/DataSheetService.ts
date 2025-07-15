import { DatasheetsModel } from "../interfaces/database/TableInterfaces";
import DataSheetRepository from "../repositories/DataSheetRepository";

class DataSheetService {
    public async getDataSheetById(id: number): Promise<DatasheetsModel> {
        const dataSheet = await DataSheetRepository.getByIDAsync(id);
        if (!dataSheet)
            throw new Error("Data sheet not found");

        return dataSheet;
    }
}

export default new DataSheetService();