import { InteractionEvent } from "../../interfaces/application";
import { DatasheetsModel, DatasheetsSaveModel } from "../../interfaces/database/TableInterfaces";
import DataSheetRepository from "../../repositories/DataSheetRepository";
import { BaseDomainService } from "./BaseDomainService";

class DataSheetService extends BaseDomainService<DatasheetsModel, DatasheetsSaveModel, typeof DataSheetRepository> {
    protected readonly repository = DataSheetRepository;

    public getAllAsync(): Promise<DatasheetsModel[]> {
        return this.repository.getAllAsync();
    }

    protected async performSaveAsync(savable: DatasheetsSaveModel, event: InteractionEvent): Promise<DatasheetsModel> {
        return await this.repository.saveAsync(savable);
    }

    public purgeAsync(id: number): Promise<void> {
        return this.repository.purgeAsync(id);
    }
}

export default new DataSheetService();