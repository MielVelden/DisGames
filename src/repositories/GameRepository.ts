import { GamesModel, GamesSaveModel } from "../interfaces/database";
import BaseRepository from "./BaseRepository.js";
import { TableEnum } from "../interfaces/enums/index.js";

class GameRepository {
    private baseRepository: BaseRepository<GamesModel, GamesSaveModel>;

    constructor() {
        this.baseRepository = new BaseRepository<GamesModel, GamesSaveModel>(TableEnum.GAMES);
    }

    async getAllGamesAsync(): Promise<GamesModel[]> {
        return this.baseRepository.Select().Execute();
    }

    async getByIdAsync(id: number) {
        const model = await this.baseRepository.Select().Where({ Id: id }).Limit(1).Execute();
        return model[0];
    }

    async getByChannelIdAsync(channelId: string): Promise<GamesModel> {
        const model = await this.baseRepository.Select().Where({ ChannelId: channelId }).Limit(1).Execute();
        return model[0];
    }

    async save(model: GamesSaveModel): Promise<GamesModel> {
        // TODO: Check if values are valid

        return this.baseRepository.Save(model);
    }
}

export default new GameRepository();