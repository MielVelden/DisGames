import { PointsModel, PointsModelFieldEnum, PointsSaveModel, RepositoryWithBase } from "../interfaces/database";
import BaseRepository, { RepositoryUtils } from "./BaseRepository";
import { StoredProcedureEnum, TableEnum } from "../interfaces/enums/index";
import { ProfileResponse } from "../interfaces/view";
import { runQueryAsync, getTableName } from "./util/ConnectionHandler";

class PointRepository implements RepositoryWithBase<PointsModel, PointsSaveModel> {
    public readonly baseRepository: BaseRepository<PointsModel, PointsSaveModel>;

    constructor() {
        this.baseRepository = new BaseRepository<PointsModel, PointsSaveModel>(TableEnum.POINTS, PointsModelFieldEnum);
    }

    async getByIdAsync(id: number): Promise<PointsModel | null> {
        return this.baseRepository.getById(id);
    }

    async getAllAsync(): Promise<PointsModel[]> {
        return this.baseRepository.Select().Execute();
    }

    async saveAsync(model: PointsSaveModel): Promise<PointsModel> {
        return this.baseRepository.Save(model);
    }

    async purgeAsync(id: number): Promise<void> {
        await this.baseRepository.Delete(id);
    }

    async getPointsByUserIdAsync(userId: string, serverId: string): Promise<PointsModel> {
        const model = await this.baseRepository.Select().Where({ UserId: userId, ServerId: serverId }).Limit(1).Execute();
        return model[0];
    }

    async getPointsAsync(userId: string): Promise<PointsModel | null> {
        const model = await this.baseRepository.Select().Where({ UserId: userId }).GroupBy(['ServerId','GameId']).Limit(1).Execute();
        if (!model || model.length === 0)
            return null;
        return model[0];
    }

    async getPointsByUserServerGameIdAsync(userId: string, serverId: string, gameId: number): Promise<PointsModel | null> {
        const model = await this.baseRepository.Select().Where({ UserId: userId, ServerId: serverId, GameId: gameId }).Limit(1).Execute();
        if (!model || model.length === 0)
            return null;
        return model[0];
    }

    async getUserProfileAsync(userId: string): Promise<ProfileResponse> {
        const model = await RepositoryUtils.CallStoredProcedureGeneric(StoredProcedureEnum.GetUserProfile, [userId]);
        return model[0] as ProfileResponse;
    }

    async getGameRankAsync(userId: string, serverId: string, gameId: number): Promise<{ rank: number; total: number }> {
        const tableName = getTableName(TableEnum.POINTS);
        const userPoints = await this.baseRepository.Select().Where({ UserId: userId, ServerId: serverId, GameId: gameId }).Limit(1).Execute();
        
        if (!userPoints || userPoints.length === 0) {
            const total = await this.baseRepository.Select().Where({ ServerId: serverId, GameId: gameId }).Count();
            return { rank: 0, total };
        }
        
        const userPointsValue = userPoints[0].Points;
        
        const query = `
            SELECT 
                (SELECT COUNT(*) + 1 
                 FROM ${tableName} p2 
                 WHERE p2.ServerId = ? 
                   AND p2.GameId = ? 
                   AND p2.Points > ?
                ) as \`Rank\`,
                (SELECT COUNT(DISTINCT UserId) 
                 FROM ${tableName} 
                 WHERE ServerId = ? 
                   AND GameId = ?
                ) as Total
        `;
        
        const results = await runQueryAsync(query, [serverId, gameId, userPointsValue, serverId, gameId]);
        
        if (!results || results.length === 0)
            return { rank: 0, total: 0 };
        
        const result = results[0];
        return {
            rank: result.Rank || result.rank || 0,
            total: result.Total || result.total || 0
        };
    }

    async getTotalPointsAsync(): Promise<number> {
        return await this.baseRepository.Select().Sum("Points");
    }
}

export default new PointRepository();