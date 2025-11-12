import { GameDataModel, GameDataModelFieldEnum, GameDataSaveModel } from "../interfaces/database/TableInterfaces";
import { Repository } from "../interfaces/database";
import BaseRepository from "./BaseRepository";
import { ExceptionEnum, StoredProcedureEnum, TableEnum } from "../interfaces/enums/index";
import { GameTypeEnum } from "../interfaces/enums/database/GameTypeEnum";
import { ErrorHelper } from "../utils/application/Error";

class GameDataRepository implements Repository<GameDataModel> {
    private baseRepository: BaseRepository<GameDataModel, GameDataSaveModel>;

    constructor() {
        this.baseRepository = new BaseRepository<GameDataModel, GameDataSaveModel>(TableEnum.GAME_DATA, GameDataModelFieldEnum);
    }

    async getByIdAsync(id: number): Promise<GameDataModel | null> {
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

    async getRandomDataByGameIdAsync(gameId: number): Promise<GameDataModel[]> {
        const result = await this.baseRepository.CallStoredProcedure(StoredProcedureEnum.Getrandomgamedata, [gameId]);
        if (!result || result.length === 0)
            ErrorHelper.throwWithParameters(ExceptionEnum.RECORD_NOT_FOUND, { recordType: TableEnum.GAME_DATA.toString() });

        const errorMsg = (result.find((item: any) => item?.Errormsg) as any)?.Errormsg;
        if (errorMsg)
            ErrorHelper.throwWithParameters(ExceptionEnum.FUNCTION_RETURNED_INVALID_RESULT, { functionName: StoredProcedureEnum.Getrandomgamedata.toString() });

        return result;
    }
}

export default new GameDataRepository();