import { InteractionEvent } from "../../interfaces/application";
import { EventsModel, EventsSaveModel } from "../../interfaces/database/TableInterfaces";
import { MetricEnum } from "../../interfaces/enums";
import EventRepository from "../../repositories/EventRepository";
import { TrackMetricPull } from "../../utils/helpers/Decorator";
import { BaseDomainService } from "./BaseDomainService";

class EventService extends BaseDomainService<EventsModel, EventsSaveModel, typeof EventRepository> {
    protected readonly repository = EventRepository;

    public getAllAsync(): Promise<EventsModel[]> {
        return this.repository.getAllAsync();
    }

    protected async performSaveAsync(savable: EventsSaveModel, _event: InteractionEvent): Promise<EventsModel> {
        return await this.repository.saveAsync(savable);
    }

    public purgeAsync(id: number): Promise<void> {
        return this.repository.purgeAsync(id);
    }

    @TrackMetricPull(MetricEnum.Events)
    public async getTotalAsync() {
        return this.repository.getTotalAsync();
    }
}

export default new EventService();