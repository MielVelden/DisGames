import { InteractionEvent } from "../../interfaces/application";
import { EventsModel, EventsSaveModel } from "../../interfaces/database/TableInterfaces";
import EventsRepository from "../../repositories/EventsRepository";
import { BaseDomainService } from "./BaseDomainService";

class EventsService extends BaseDomainService<EventsModel, EventsSaveModel, typeof EventsRepository> {
    protected readonly repository = EventsRepository;

    public getAllAsync(): Promise<EventsModel[]> {
        return this.repository.getAllAsync();
    }

    protected async performSaveAsync(savable: EventsSaveModel, event: InteractionEvent): Promise<EventsModel> {
        return await this.repository.saveAsync(savable);
    }

    public purgeAsync(id: number): Promise<void> {
        return this.repository.purgeAsync(id);
    }
}

export default new EventsService();