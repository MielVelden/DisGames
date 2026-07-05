import { InteractionEvent } from "../../interfaces/application";
import { DatasheetsModel, DatasheetsSaveModel } from "../../interfaces/database/TableInterfaces";
import { GameTypeEnum } from "../../interfaces/enums";
import DataSheetRepository from "../../repositories/DataSheetRepository";
import { BaseDomainService } from "./BaseDomainService";
import GameDataService from "./GameDataService";

class DataSheetService extends BaseDomainService<DatasheetsModel, DatasheetsSaveModel, typeof DataSheetRepository> {
    protected readonly repository = DataSheetRepository;

    public getAllAsync(): Promise<DatasheetsModel[]> {
        return this.repository.getAllAsync();
    }

    protected async performSaveAsync(savable: DatasheetsSaveModel, _event: InteractionEvent): Promise<DatasheetsModel> {
        return await this.repository.saveAsync(savable);
    }

    public purgeAsync(id: number): Promise<void> {
        return this.repository.purgeAsync(id);
    }

    public async getByGameIdAsync(gameId: GameTypeEnum): Promise<DatasheetsModel[]> {
        const gameDataModels = await GameDataService.getByGameIdAsync(gameId);
        const datasheets = await this.repository.getAllAsync();
        const ids = Array.from(new Set(gameDataModels.map(model => model.DataSheetId)));
        return datasheets.filter(datasheet => ids.includes(datasheet.Id));
    }

    public async getCountByGameIdAsync(gameId: GameTypeEnum, dataSheetId: number | null = null): Promise<number> {
        const gameDataModels = await GameDataService.getByGameIdAsync(gameId);
        return gameDataModels.filter(model => model.DataSheetId === dataSheetId).length;
    }
}

export default new DataSheetService();