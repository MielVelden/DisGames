import { GamesXDatasheetsModel, GamesXDatasheetsModelFieldEnum, GamesXDatasheetsSaveModel, RepositoryWithBase } from "../interfaces/database";
import BaseRepository from "./BaseRepository";
import { TableEnum } from "../interfaces/enums/index";

class GamesXDatasheetRepository implements RepositoryWithBase<GamesXDatasheetsModel, GamesXDatasheetsSaveModel> {
    public readonly baseRepository: BaseRepository<GamesXDatasheetsModel, GamesXDatasheetsSaveModel>;

    constructor() {
        this.baseRepository = new BaseRepository<GamesXDatasheetsModel, GamesXDatasheetsSaveModel>(TableEnum.GAMESXDATASHEETS, GamesXDatasheetsModelFieldEnum);
    }

    async getByIdAsync(id: number): Promise<GamesXDatasheetsModel | null> {
        return this.baseRepository.getById(id);
    }

    async getAllAsync(): Promise<GamesXDatasheetsModel[]> {
        return this.baseRepository.Select().Execute();
    }

    async saveAsync(model: GamesXDatasheetsSaveModel): Promise<GamesXDatasheetsModel> {
        return this.baseRepository.Save(model);
    }

    async purgeAsync(id: number): Promise<void> {
        await this.baseRepository.Delete(id);
    }

    async getByGameIdAsync(gameId: number): Promise<GamesXDatasheetsModel[]> {
        return this.baseRepository.Select().Where({ GameId: gameId }).Execute();
    }
}

export default new GamesXDatasheetRepository();