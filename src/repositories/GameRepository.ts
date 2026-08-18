import { GamesModel, GamesModelFieldEnum, GamesSaveModel, getGamesFieldType, RepositoryWithBase } from "../interfaces/database";
import BaseRepository from "./BaseRepository";
import { GameTypeEnum, TableEnum } from "../interfaces/enums/index";
import { getTableName, runQueryAsync } from "./util/ConnectionHandler";

class GameRepository implements RepositoryWithBase<GamesModel, GamesSaveModel, typeof GamesModelFieldEnum> {
    public readonly baseRepository: BaseRepository<GamesModel, GamesSaveModel, typeof GamesModelFieldEnum>;

    constructor() {
        this.baseRepository = new BaseRepository<GamesModel, GamesSaveModel, typeof GamesModelFieldEnum>(
            TableEnum.GAMES, 
            GamesModelFieldEnum, 
            getGamesFieldType
        );
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

    async getTotalAsync(): Promise<number> {
        return await this.baseRepository.Select().Count();
    }

    async getDistinctServerCountAsync(): Promise<number> {
        const tableName = getTableName(TableEnum.GAMES);
        const results = await runQueryAsync(
            `SELECT COUNT(DISTINCT ServerId) AS Total FROM ${tableName}`,
            []
        );
        if (!results || results.length === 0)
            return 0;
        const row = results[0] as { Total?: number; total?: number };
        return row.Total ?? row.total ?? 0;
    }

    async getExternalIdsAsync(): Promise<string[]> {
        return this.baseRepository.getExternalIdsAsync();
    }

    async getMostPopularGameTypeAsync(): Promise<GameTypeEnum | null> {
        const tableName = getTableName(TableEnum.GAMES);
        const results = await runQueryAsync(
            `SELECT GameTypeEnum FROM ${tableName} GROUP BY GameTypeEnum ORDER BY COUNT(*) DESC LIMIT 1`,
            []
        );
        if (!results || results.length === 0)
            return null;
        const row = results[0] as { GameTypeEnum?: number; gametypeenum?: number };
        const raw = row.GameTypeEnum ?? row.gametypeenum;
        if (raw === undefined || raw === null)
            return null;
        return raw as GameTypeEnum;
    }
}

export default new GameRepository();