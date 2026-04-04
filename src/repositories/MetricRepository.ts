import { MetricsModel, MetricsModelFieldEnum, MetricsSaveModel, getMetricsFieldType, RepositoryWithBase } from "../interfaces/database";
import BaseRepository from "./BaseRepository";
import { MetricEnum, TableEnum } from "../interfaces/enums/index";

class MetricRepository implements RepositoryWithBase<MetricsModel, MetricsSaveModel, typeof MetricsModelFieldEnum> {
    public readonly baseRepository: BaseRepository<MetricsModel, MetricsSaveModel, typeof MetricsModelFieldEnum>;

    constructor() {
        this.baseRepository = new BaseRepository<MetricsModel, MetricsSaveModel, typeof MetricsModelFieldEnum>(TableEnum.METRICS, MetricsModelFieldEnum, getMetricsFieldType);
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

    async getLatestByMetricAsync(metric: MetricEnum): Promise<MetricsModel> {
        const model = await this.baseRepository.Select().Where({ MetricEnum: metric }).OrderBy("Datetime", "DESC").Limit(1).Execute();
        return model[0];
    }
}

export default new MetricRepository();