import { GameDataModel, GameDataSaveModel } from "../interfaces/database";
import BaseRepository from "./BaseRepository";
import { LanguageEnum, TableEnum } from "../interfaces/enums/index";
import { GameTypeEnum } from "../interfaces/enums/database/GameTypeEnum";
import { DEFAULT_LANGUAGE } from "../utils/i18n/MultiLangualString";

class GameDataRepository {
    private baseRepository: BaseRepository<GameDataModel, GameDataSaveModel>;

    constructor() {
        this.baseRepository = new BaseRepository<GameDataModel, GameDataSaveModel>(TableEnum.GAME_DATA);
    }

    async getAllGameDataAsync(): Promise<GameDataModel[]> {
        return this.baseRepository.Select().Execute();
    }

    async getByGameIdAsync(gameId: GameTypeEnum): Promise<GameDataModel> {
        const model = await this.baseRepository.Select().Where({ GameId: gameId }).Limit(1).Execute();
        return model[0];
    }

    async getGameDataByGameIdAsync(gamesId: number): Promise<GameDataModel> {
        const result = await this.baseRepository.CallStoredProcedure('GetRandomGameData', [gamesId]);
        if (!result || result.length === 0) {
            throw new Error('No game data found');
        }
        return result[0];
    }

    async getGameDataByIdAsync(id: number) {
        const model = await this.baseRepository.Select().Where({ Id: id }).Limit(1).Execute();
        return model[0];
    }

    async save(model: GameDataSaveModel): Promise<GameDataModel> {
        return this.baseRepository.Save(model);
    }
}

export default new GameDataRepository();