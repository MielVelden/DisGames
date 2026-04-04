import { InteractionEvent } from "../../interfaces/application";
import { MetricsModel, MetricsSaveModel } from "../../interfaces/database/TableInterfaces";
import { MetricPullRegistration } from "../../interfaces/domain";
import { ExceptionEnum } from "../../interfaces/enums";
import { MetadataKeyEnum } from "../../interfaces/enums/application/MetadataKeyEnum";
import { MetricEnum, MetricTypeEnum } from "../../interfaces/enums/application/MetricEnum";
import MetricRepository from "../../repositories/MetricRepository";
import { ErrorHelper } from "../../utils/application/Error";
import { getEnumAsList } from "../../utils/helpers/Enum";
import { getEnumProperty } from "../../utils/helpers/EnumMetadata";
import { BaseDomainService } from "./BaseDomainService";

class MetricService extends BaseDomainService<MetricsModel, MetricsSaveModel, typeof MetricRepository> {
    protected readonly repository = MetricRepository;
    private registrations: MetricPullRegistration[] = [];

    public getAllAsync(): Promise<MetricsModel[]> {
        return this.repository.getAllAsync();
    }

    protected async performSaveAsync(savable: MetricsSaveModel, event: InteractionEvent): Promise<MetricsModel> {
        if (!savable.Date)
            ErrorHelper.throw(ExceptionEnum.RECORD_NOT_FOUND);

        const metrics = await this.repository.getByDateAsync(savable.Date);
        if (metrics)
            ErrorHelper.throw(ExceptionEnum.RECORD_ALREADY_EXISTS);

        return await this.repository.saveAsync(savable);
    }

    public purgeAsync(id: number): Promise<void> {
        return this.repository.purgeAsync(id);
    }

    public async collectMetricsAsync(): Promise<void> {
        const metricsPull = getEnumAsList(MetricEnum).filter(metric => getEnumProperty(MetricEnum, metric, MetadataKeyEnum.MetricType) === MetricTypeEnum.Pull);
        console.log('metricsPull ', metricsPull);

        const metricsPush = getEnumAsList(MetricEnum).filter(metric => getEnumProperty(MetricEnum, metric, MetadataKeyEnum.MetricType) === MetricTypeEnum.Push);
        console.log('metricsPush ', metricsPush);

        await Promise.all(
            this.registrations.map(async (x) => {
                const value = await x.fnAsync();
                console.log(x.metric, ' : ', value);
            })
        );
    }

    public async incrementAsync(metric: MetricEnum, amount: number = 1) {
        console.log('increment: ', metric, ' : ', amount)
    }

    public registerPull(metric: MetricEnum, fnAsync: () => Promise<number>): void {
        this.registrations.push({ metric, fnAsync });
    }

}

export default new MetricService();