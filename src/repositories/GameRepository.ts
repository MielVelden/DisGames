import { GamesModel, GamesModelFieldEnum, GamesSaveModel } from "../interfaces/database";
import { Repository } from "../interfaces/database";
import BaseRepository from "./BaseRepository";
import { GameTypeEnum, TableEnum } from "../interfaces/enums/index";

class GameRepository implements Repository<GamesModel> {
    private baseRepository: BaseRepository<GamesModel, GamesSaveModel>;

    constructor() {
        this.baseRepository = new BaseRepository<GamesModel, GamesSaveModel>(TableEnum.GAMES, GamesModelFieldEnum);
    }

    async getByIdAsync(id: number): Promise<GamesModel | null> {
        return this.baseRepository.getById(id);
    }

    async getAllAsync(): Promise<GamesModel[]> {
        return this.baseRepository.Select().Execute();
    }

    async saveAsync(model: GamesSaveModel): Promise<GamesModel> {
        return this.baseRepository.Save(model);
    }

    async purgeAsync(id: number): Promise<void> {
        await this.baseRepository.Delete(id);
    }

    async getByChannelIdAsync(channelId: string): Promise<GamesModel> {
        const model = await this.baseRepository.Select().Where({ ChannelId: channelId }).Limit(1).Execute();
        return model[0];
    }

    async getByServerAndGameIdAsync(serverId: string, gameType: GameTypeEnum): Promise<GamesModel> {
        const model = await this.baseRepository.Select().Where({ ServerId: serverId, GameTypeEnum: gameType }).Limit(1).Execute();
        return model[0];
    }

    async getByServerIdAsync(serverId: string): Promise<GamesModel[]> {
        const model = await this.baseRepository.Select().Where({ ServerId: serverId }).Execute();
        return model;
    }
}

export default new GameRepository();