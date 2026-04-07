import { InteractionEvent, WebSocketEvent } from "../../interfaces/application";
import { MetricsModel, MetricsSaveModel } from "../../interfaces/database/TableInterfaces";
import { MetricEnum } from "../../interfaces/enums/application/MetricEnum";
import MetricRepository from "../../repositories/MetricRepository";
import { getPullRegistrations } from "../../utils/registries/MetricRegistry";
import { BaseDomainService } from "./BaseDomainService";
import { getSystemEventAsync } from "../../utils/helpers/Timeline";
import { wsService } from "../../server";
import { CacheMetric } from "../../interfaces/domain";

class MetricService extends BaseDomainService<MetricsModel, MetricsSaveModel, typeof MetricRepository> {
    protected readonly repository = MetricRepository;
    private cache = new Map<MetricEnum, CacheMetric>();

    public async initAsync() {
        this.cache = await this.repository.getAllByMetricAsync();
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
        const currentValue = this.cache.get(metric);
        const newValue = currentValue?.value ? currentValue.value + amount : amount;
        this.cache.set(metric, {
            value: newValue,
            updated: false,
        });
    }

    public async flushAsync() {
        this.cache.forEach(async (x, key) => {
            if (!x.updated) {
                const event = await getSystemEventAsync();
                this.saveAsync(new MetricsSaveModel({
                    MetricEnum: key,
                    Datetime: new Date(),
                    Value: x.value
                }), event);
            }
        });
    }

    public async getLatestByMetricAsync(metric: MetricEnum) {
        return this.repository.getLatestByMetricAsync(metric);
    }
}

export default new MetricService();