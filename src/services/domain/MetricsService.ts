import { InteractionEvent } from "../../interfaces/application";
import { MetricsModel, MetricsSaveModel } from "../../interfaces/database/TableInterfaces";
import { ExceptionEnum } from "../../interfaces/enums";
import MetricsRepository from "../../repositories/MetricsRepository";
import { ErrorHelper } from "../../utils/application/Error";
import { BaseDomainService } from "./BaseDomainService";

class MetricsService extends BaseDomainService<MetricsModel, MetricsSaveModel, typeof MetricsRepository> {
    protected readonly repository = MetricsRepository;

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
}

export default new MetricsService();