import { GameDataModel } from "../interfaces/database/TableInterfaces";
import { GameTypeEnum } from "../interfaces/enums";
import GameDataRepository from "../repositories/GameDataRepository";

class GameDataService {
    public async getGameData(gameId: GameTypeEnum): Promise<GameDataModel> {
        const gameData = await GameDataRepository.getGameDataByGameIdAsync(gameId);
        return gameData;
    }
}

export default new GameDataService();