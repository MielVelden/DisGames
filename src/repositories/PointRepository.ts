import { PointsModel, PointsSaveModel } from "../interfaces/database";
import BaseRepository from "./BaseRepository.js";
import { TableEnum } from "../interfaces/enums/index.js";

class PointRepository {
    private baseRepository: BaseRepository<PointsModel, PointsSaveModel>;

    constructor() {
        this.baseRepository = new BaseRepository<PointsModel, PointsSaveModel>(TableEnum.POINTS);
    }

    async getAllPointsAsync(): Promise<PointsModel[]> {
        return this.baseRepository.Select().Execute();
    }

    async getPointsByUserIdAsync(userId: string, serverId: string): Promise<PointsModel> {
        const model = await this.baseRepository.Select().Where({ UserId: userId, ServerId: serverId }).Limit(1).Execute();
        return model[0];
    }

    async getPointByIdAsync(id: number) {
        const model = await this.baseRepository.Select().Where({ Id: id }).Limit(1).Execute();
        return model[0];
    }

    async save(model: PointsSaveModel): Promise<PointsModel> {
        return this.baseRepository.Save(model);
    }
}

export default new PointRepository();