import { InteractionEvent } from "../../interfaces/application";
import { GameDataModel, GameDataModelFieldEnum, GameDataSaveModel } from "../../interfaces/database/TableInterfaces";
import { ExceptionEnum, GameTypeEnum } from "../../interfaces/enums";
import GameDataRepository from "../../repositories/GameDataRepository";
import { ErrorHelper } from "../../utils/application/Error";
import { getService, registerService } from "../../utils/container/Container";
import { BaseDomainService } from "./BaseDomainService";
import { GameService } from "./GameService";

export class GameDataService extends BaseDomainService<GameDataModel, GameDataSaveModel, typeof GameDataRepository> {
    protected readonly repository = GameDataRepository;

    public async initAsync(): Promise<void> {}

    public getAllAsync(): Promise<GameDataModel[]> {
        return this.repository.getAllAsync();
    }

    protected async performSaveAsync(savable: GameDataSaveModel, _event: InteractionEvent): Promise<GameDataModel> {
        if (savable.Response) {
            savable.Response = savable.Response.changeText(text => text.trim().toLowerCase());
            if (!savable.Response.getMessage())
                ErrorHelper.throw(ExceptionEnum.INVALID_ARGUMENT);
        }

        if (savable.isUpdate()) {
            const model = await this.repository.getByIdAsync(savable.getId()!);
            savable.validateHasNotChanged(GameDataModelFieldEnum.DataSheetId, model?.DataSheetId);
            savable.validateHasNotChanged(GameDataModelFieldEnum.GameId, model?.GameId);
        } else {
            const gameId = savable.validateIsNotNull(GameDataModelFieldEnum.GameId);
            const response = savable.validateIsNotNull(GameDataModelFieldEnum.Response);

            const gameService = getService<GameService>(GameService.serviceToken);
            const gameModule = await gameService.getGameByTypeAsync(gameId as GameTypeEnum);

            if(!gameModule?.config.hasDataSheets) {
                if(savable.DataSheetId === undefined || savable.DataSheetId === 0)
                    delete savable.DataSheetId;
            }

            const allowDuplicateResponses = gameModule?.config.allowDuplicatesResponse ?? false;

            if (!allowDuplicateResponses) {
                const primaryValue = response?.getMessage();
                const duplicates = await this.repository.getAllDuplicatesAsync(gameId, primaryValue);
                if (duplicates.length > 0)
                    ErrorHelper.throw(ExceptionEnum.RECORD_IS_DUPLICATE);
            }
        }

        return await this.repository.saveAsync(savable);
    }

    public purgeAsync(id: number): Promise<void> {
        return this.repository.purgeAsync(id);
    }

    public async getRandomDataByGameIdAsync(gameId: number): Promise<GameDataModel[]> {
        return await this.repository.getRandomDataByGameIdAsync(gameId);
    }

    public async getByDataSheetIdAsync(dataSheetId: number): Promise<GameDataModel[]> {
        return await this.repository.getByDataSheetIdAsync(dataSheetId);
    }

    public async getByGameIdAsync(gameId: GameTypeEnum): Promise<GameDataModel[]> {
        return await this.repository.getByGameIdAsync(gameId);
    }
}

const gameDataService = new GameDataService();
registerService(gameDataService);
export default gameDataService;