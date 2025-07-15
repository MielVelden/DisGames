import { GameDataModel } from "../interfaces/database/TableInterfaces";
import GameDataRepository from "../repositories/GameDataRepository";

class GameDataService {
    public async getGameDataAsync(gamesId: number): Promise<GameDataModel> {
        const gameData = await GameDataRepository.getGameDataByGameIdAsync(gamesId);
        return gameData;
    }
}

export default new GameDataService();