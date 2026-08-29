import { MetricsModel, MetricsModelFieldEnum, MetricsSaveModel, getMetricsFieldType, RepositoryWithBase } from "../interfaces/database";
import BaseRepository, { RepositoryUtils } from "./BaseRepository";
import { ExceptionEnum, MetricEnum, StoredProcedureEnum, TableEnum } from "../interfaces/enums/index";
import { runQueryAsync } from "./util/ConnectionHandler";
import { ErrorHelper } from "../utils/application/Error";
import { CacheMetric } from "../interfaces/domain";
import { Duration } from "../interfaces/application/Duration";
import { subtractDurationFromDate } from "../utils/helpers/Duration";

class MetricRepository implements RepositoryWithBase<MetricsModel, MetricsSaveModel, typeof MetricsModelFieldEnum> {
    public readonly baseRepository: BaseRepository<MetricsModel, MetricsSaveModel, typeof MetricsModelFieldEnum>;

    constructor() {
        this.baseRepository = new BaseRepository<MetricsModel, MetricsSaveModel, typeof MetricsModelFieldEnum>(
            TableEnum.METRICS, 
            MetricsModelFieldEnum, 
            getMetricsFieldType
        );
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

    async getAllByMetricAsync(): Promise<Map<MetricEnum, CacheMetric>> {
        const map = new Map<MetricEnum, CacheMetric>;
        const model = await runQueryAsync("SELECT Id, MetricEnum, Datetime, Value FROM (SELECT *,ROW_NUMBER() OVER (PARTITION BY MetricEnum ORDER BY Datetime DESC) AS rn FROM metrics) t WHERE rn = 1;") as MetricsModel[];
        if(!model)
            ErrorHelper.throw(ExceptionEnum.RECORD_NOT_FOUND);
        
        model.forEach(x=> {
            map.set(x.MetricEnum, { 
                value: x.Value,
                updated: true
            });
        });

        return map;
    }

    async getLatestByMetricAsync(metric: MetricEnum): Promise<MetricsModel> {
        const model = await this.baseRepository.Select().Where({ MetricEnum: metric }).OrderBy("Datetime", "DESC").Limit(1).Execute();
        return model[0];
    }

    async getPreviousByMetricAsync(metric: MetricEnum, minAge?: Duration): Promise<MetricsModel> {
        if(minAge === undefined) {
            const model = await this.baseRepository.Select().Where({ MetricEnum: metric }).OrderBy("Datetime", "DESC").Limit(2).Execute();
            return model[1];
        }

        const cutoff = subtractDurationFromDate(minAge, new Date());
        const model = await this.baseRepository.Select()
            .Where({ MetricEnum: metric, Datetime: { operator: "<=", value: cutoff } })
            .OrderBy("Datetime", "DESC")
            .Limit(1)
            .Execute();
        return model[0];
    }

    async purgeOldAsync(minAge: Duration, bucket: Duration): Promise<void> {
        await RepositoryUtils.CallStoredProcedureGeneric(StoredProcedureEnum.CleanUpMetrics, [minAge, bucket]);
    }
}

export default new MetricRepository();