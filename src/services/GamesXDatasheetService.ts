import { GamesXDatasheetsModel, GamesXDatasheetsSaveModel } from "../interfaces/database/TableInterfaces";
import GamesXDatasheetRepository from "../repositories/GamesXDatasheetRepository";

class GamesXDatasheetService {
    public async getGamesXDatasheetsByGameIdAsync(gameId: number): Promise<GamesXDatasheetsModel[]> {
        const gamesXDatasheets = await GamesXDatasheetRepository.getByGameIdAsync(gameId);
        if (!gamesXDatasheets)
            throw new Error("Games x datasheets not found");

        return gamesXDatasheets;
    }

    public async saveAsync(model: GamesXDatasheetsSaveModel): Promise<GamesXDatasheetsModel> {
        return await GamesXDatasheetRepository.saveAsync(model);
    }
}

export default new GamesXDatasheetService();