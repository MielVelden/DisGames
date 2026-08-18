import { InteractionEvent } from "../../interfaces/application";
import { EventsModel, EventsSaveModel } from "../../interfaces/database/TableInterfaces";
import EventRepository from "../../repositories/EventRepository";
import { BaseDomainService } from "./BaseDomainService";
import { registerService } from "../../utils/container/Container";

export class EventService extends BaseDomainService<EventsModel, EventsSaveModel, typeof EventRepository> {
    protected readonly repository = EventRepository;

    public async initAsync(): Promise<void> {}

    public getAllAsync(): Promise<EventsModel[]> {
        return this.repository.getAllAsync();
    }

    protected async performSaveAsync(savable: EventsSaveModel, _event: InteractionEvent): Promise<EventsModel> {
        return await this.repository.saveAsync(savable);
    }

    public purgeAsync(id: number): Promise<void> {
        return this.repository.purgeAsync(id);
    }

    public async getTotalAsync() {
        return this.repository.getTotalAsync();
    }


}

const eventService = new EventService();
registerService(eventService);
export default eventService;