import { DatasheetsModel, DatasheetsSaveModel, GamesXDatasheetsModel, GamesXDatasheetsSaveModel } from "../interfaces/database";
import BaseRepository from "./BaseRepository";
import { TableEnum } from "../interfaces/enums/index";

class GamesXDatasheetRepository {
    private baseRepository: BaseRepository<GamesXDatasheetsModel, GamesXDatasheetsSaveModel>;

    constructor() {
        this.baseRepository = new BaseRepository<GamesXDatasheetsModel, GamesXDatasheetsSaveModel>(TableEnum.GAMESXDATASHEETS);
    }

    async getGamesXDatasheetsByGameIdAsync(gameId: number): Promise<GamesXDatasheetsModel[]> {
        return this.baseRepository.Select().Where({ GameId: gameId }).Execute();
    }

    async getGamesXDatasheetByIdAsync(id: number): Promise<GamesXDatasheetsModel> {
        const model = await this.baseRepository.Select().Where({ Id: id }).Limit(1).Execute();
        return model[0];
    }

    async save(model: GamesXDatasheetsSaveModel): Promise<GamesXDatasheetsModel> {
        return this.baseRepository.Save(model);
    }
}

export default new GamesXDatasheetRepository();