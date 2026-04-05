import { InteractionEvent, WebSocketEvent } from "../../interfaces/application";
import { MetricsModel, MetricsSaveModel } from "../../interfaces/database/TableInterfaces";
import { MetadataKeyEnum } from "../../interfaces/enums/application/MetadataKeyEnum";
import { MetricEnum, MetricTypeEnum } from "../../interfaces/enums/application/MetricEnum";
import MetricRepository from "../../repositories/MetricRepository";
import { getEnumAsList } from "../../utils/helpers/Enum";
import { getEnumProperty } from "../../utils/helpers/EnumMetadata";
import { getPullRegistrations } from "../../utils/registries/MetricRegistry";
import { BaseDomainService } from "./BaseDomainService";
import { getSystemEventAsync } from "../../utils/helpers/Timeline";
import { wsService } from "../../server";

class MetricService extends BaseDomainService<MetricsModel, MetricsSaveModel, typeof MetricRepository> {
    protected readonly repository = MetricRepository;

    public async initAsync() {
        // TODO: Load all metrics in cache
    }

    public getAllAsync(): Promise<MetricsModel[]> {
        return this.repository.getAllAsync();
    }

    protected async performSaveAsync(savable: MetricsSaveModel, event: InteractionEvent): Promise<MetricsModel> {
        const entity = await this.repository.saveAsync(savable);

        wsService.broadcastMessageAsync(WebSocketEvent.UPDATE_METRIC, entity);
        return entity;
    }

    public purgeAsync(id: number): Promise<void> {
        return this.repository.purgeAsync(id);
    }

    public async collectMetricsAsync(): Promise<void> {
        const metricsPull = getEnumAsList(MetricEnum).filter(metric => getEnumProperty(MetricEnum, metric, MetadataKeyEnum.MetricType) === MetricTypeEnum.Pull);
        console.log('metricsPull ', metricsPull);

        const metricsPush = getEnumAsList(MetricEnum).filter(metric => getEnumProperty(MetricEnum, metric, MetadataKeyEnum.MetricType) === MetricTypeEnum.Push);
        console.log('metricsPush ', metricsPush);

        const date = new Date();
        const event = await getSystemEventAsync();
        await Promise.all(
            getPullRegistrations().map(async (pullRegistration) => {
                const value = await pullRegistration.fnAsync();
                this.saveAsync(new MetricsSaveModel({
                    MetricEnum: pullRegistration.metric,
                    Datetime: date,
                    Value: value
                }), event)
            })
        );
    }

    public async incrementAsync(metric: MetricEnum, amount: number = 1) {
        const entity = await this.repository.getLatestByMetricAsync(metric);
        const newValue = entity?.Value ? entity.Value + amount : amount;

        const event = await getSystemEventAsync();
        this.saveAsync(new MetricsSaveModel({
            MetricEnum: metric,
            Datetime: new Date(),
            Value: newValue
        }), event);
    }

    public async getLatestByMetricAsync(metric: MetricEnum) {
        return this.repository.getLatestByMetricAsync(metric);
    }
}

export default new MetricService();