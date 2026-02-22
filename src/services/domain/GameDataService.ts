import { InteractionEvent } from "../../interfaces/application";
import { GameDataModel, GameDataSaveModel } from "../../interfaces/database/TableInterfaces";
import { GameTypeEnum } from "../../interfaces/enums";
import GameDataRepository from "../../repositories/GameDataRepository";
import { BaseDomainService } from "./BaseDomainService";

class GameDataService extends BaseDomainService<GameDataModel, GameDataSaveModel, typeof GameDataRepository> {
    protected readonly repository = GameDataRepository;

    public getAllAsync(): Promise<GameDataModel[]> {
        return this.repository.getAllAsync();
    }

    protected async performSaveAsync(savable: GameDataSaveModel, event: InteractionEvent): Promise<GameDataModel> {
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

export default new GameDataService();