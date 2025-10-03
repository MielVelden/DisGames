import { GameDataModel } from "../../interfaces/database/TableInterfaces";
import GameDataRepository from "../../repositories/GameDataRepository";

class GameDataService {
    public async getGameDataAsync(gamesId: number): Promise<GameDataModel[]> {
        return await GameDataRepository.getGameDataByGamesIdAsync(gamesId);
    }
}

export default new GameDataService();