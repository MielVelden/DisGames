import { GameDataModel, GameDataSaveModel } from "../interfaces/database";
import { Repository } from "../interfaces/database";
import BaseRepository from "./BaseRepository";
import { LanguageEnum, StoredProcedureEnum, TableEnum } from "../interfaces/enums/index";
import { GameTypeEnum } from "../interfaces/enums/database/GameTypeEnum";
import { DEFAULT_LANGUAGE } from "../utils/i18n/MultiLangualString";

class GameDataRepository implements Repository<GameDataModel> {
    private baseRepository: BaseRepository<GameDataModel, GameDataSaveModel>;

    constructor() {
        this.baseRepository = new BaseRepository<GameDataModel, GameDataSaveModel>(TableEnum.GAME_DATA);
    }

    async getByIDAsync(id: number): Promise<GameDataModel | null> {
        return this.baseRepository.getById(id);
    }

    async getAllAsync(): Promise<GameDataModel[]> {
        return this.baseRepository.Select().Execute();
    }

    async saveAsync(model: GameDataSaveModel): Promise<GameDataModel> {
        return this.baseRepository.Save(model);
    }

    async purgeAsync(id: number): Promise<void> {
        await this.baseRepository.Delete(id);
    }
    
    async getByGameIdAsync(gameId: GameTypeEnum): Promise<GameDataModel> {
       const result = await this.baseRepository.Select().Where({ GameId: gameId }).Limit(1).Execute();
       return result[0];
    }

    async getGameDataByGamesIdAsync(gamesId: number): Promise<GameDataModel> {
        const result = await this.baseRepository.CallStoredProcedure(StoredProcedureEnum.Getrandomgamedata, [gamesId]);
        if (!result || result.length === 0)
            throw new Error('No game data found');

        return result[0];
    }
}

export default new GameDataRepository();