import { GameDataModel } from "../interfaces/database/TableInterfaces";
import { GameTypeEnum, LanguageEnum } from "../interfaces/enums";
import GameDataRepository from "../repositories/GameDataRepository";

class GameDataService {
    public async getGameDataAsync(gameId: GameTypeEnum, language?: LanguageEnum): Promise<GameDataModel> {
        const gameData = await GameDataRepository.getGameDataByGameIdAsync(gameId, language);
        return gameData;
    }
}

export default new GameDataService();