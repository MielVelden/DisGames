import { PointsModel, PointsSaveModel } from "../interfaces/database";
import { Repository } from "../interfaces/database";
import BaseRepository from "./BaseRepository";
import { ExceptionEnum, TableEnum } from "../interfaces/enums/index";
import { ComponentError } from "../utils/ErrorHelper";

class PointRepository implements Repository<PointsModel> {
    private baseRepository: BaseRepository<PointsModel, PointsSaveModel>;

    constructor() {
        this.baseRepository = new BaseRepository<PointsModel, PointsSaveModel>(TableEnum.POINTS);
    }

    async getByIDAsync(id: number): Promise<PointsModel | null> {
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
}

export default new PointRepository();