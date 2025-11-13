import { PointsModel, PointsModelFieldEnum, PointsSaveModel, RepositoryWithBase } from "../interfaces/database";
import BaseRepository, { RepositoryUtils } from "./BaseRepository";
import { StoredProcedureEnum, TableEnum } from "../interfaces/enums/index";
import { ProfileView } from "../interfaces/view";

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

    async getUserProfileAsync(userId: string): Promise<ProfileView> {
        const model = await RepositoryUtils.CallStoredProcedureGeneric(StoredProcedureEnum.Getuserprofile, [userId]);
        return model[0] as ProfileView;
    }
}

export default new PointRepository();