import { MetricsModel, MetricsModelFieldEnum, MetricsSaveModel, RepositoryWithBase } from "../interfaces/database";
import BaseRepository from "./BaseRepository";
import { ExceptionEnum, TableEnum } from "../interfaces/enums/index";
import { ErrorHelper } from "../utils/application/Error";

class MetricsRepository implements RepositoryWithBase<MetricsModel, MetricsSaveModel> {
    public readonly baseRepository: BaseRepository<MetricsModel, MetricsSaveModel>;

    constructor() {
        this.baseRepository = new BaseRepository<MetricsModel, MetricsSaveModel>(TableEnum.METRICS, MetricsModelFieldEnum);
    }

    async getByIdAsync(id: number): Promise<MetricsModel | null> {
        return this.baseRepository.getById(id);
    }

    async getAllAsync(): Promise<MetricsModel[]> {
        return this.baseRepository.Select().Execute();
    }

    async saveAsync(model: MetricsSaveModel): Promise<MetricsModel> {
        return this.baseRepository.Save(model);
    }

    async purgeAsync(id: number): Promise<void> {
        await this.baseRepository.Delete(id);
    }

    async getByDateAsync(date: Date): Promise<MetricsModel> {
        const model = await this.baseRepository.Select().Where({ Date: date }).Limit(1).Execute();
        if (!model || model.length === 0)
            ErrorHelper.throw(ExceptionEnum.RECORD_NOT_FOUND);
        return model[0];
    }
}

export default new MetricsRepository();