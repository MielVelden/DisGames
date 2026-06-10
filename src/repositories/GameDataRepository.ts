import { GameDataModel, GameDataModelFieldEnum, GameDataSaveModel, getGameDataFieldType } from "../interfaces/database/TableInterfaces";
import { RepositoryWithBase } from "../interfaces/database";
import BaseRepository from "./BaseRepository";
import { ExceptionEnum, StoredProcedureEnum, TableEnum } from "../interfaces/enums/index";
import { GameTypeEnum } from "../interfaces/enums/database/GameTypeEnum";
import { ErrorHelper } from "../utils/application/Error";

class GameDataRepository implements RepositoryWithBase<GameDataModel, GameDataSaveModel, typeof GameDataModelFieldEnum> {
    public readonly baseRepository: BaseRepository<GameDataModel, GameDataSaveModel, typeof GameDataModelFieldEnum>;

    constructor() {
        this.baseRepository = new BaseRepository<GameDataModel, GameDataSaveModel, typeof GameDataModelFieldEnum>(
            TableEnum.GAME_DATA, 
            GameDataModelFieldEnum, 
            getGameDataFieldType
        );
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
    
    async getByDataSheetIdAsync(dataSheetId: number): Promise<GameDataModel[]> {
        return this.baseRepository.Select().Where({ DataSheetId: dataSheetId }).Execute();
    }

    async getByGameIdAsync(gameId: GameTypeEnum): Promise<GameDataModel[]> {
       const result = await this.baseRepository.Select().Where({ GameId: gameId }).Execute();
       return result;
    }

    async getRandomDataByGameIdAsync(gameId: number): Promise<GameDataModel[]> {
        const result = await this.baseRepository.CallStoredProcedure(StoredProcedureEnum.GetRandomGameData, [gameId]);
        if (!result || result.length === 0)
            ErrorHelper.throw(ExceptionEnum.RECORD_NOT_FOUND);

        const errorMsg = (result.find((item: any) => item?.Errormsg) as any)?.Errormsg;
        if (errorMsg)
            ErrorHelper.throwWithParameters(ExceptionEnum.FUNCTION_RETURNED_INVALID_RESULT, { functionName: StoredProcedureEnum.GetRandomGameData.toString() });

        return result;
    }

    async getAllDuplicatesAsync(gameId: number, primaryValue: string): Promise<GameDataModel[]> {
        return this.baseRepository.Select()
            .Where({ GameId: gameId })
            .WhereRaw('ResponseMLS->>\'$."1"\' = ?', [primaryValue])
            .Execute();
    }
}

export default new GameDataRepository();