import { GameDataModel, PointsModel } from "../interfaces/database/TableInterfaces";
import { GameTypeEnum } from "../interfaces/enums";
import GameDataRepository from "../repositories/GameDataRepository";
import PointRepository from "../repositories/PointRepository";

class GameDataService {
    public async getGameData(gameId: GameTypeEnum): Promise<GameDataModel> {
        const gameData = await GameDataRepository.getGameDataByGameIdAsync(gameId);
        return gameData;
    }
}

export default new GameDataService();