import { EventsModel, EventsSaveModel } from "../../interfaces/database/TableInterfaces";
import EventsRepository from "../../repositories/EventsRepository";

class EventsService {
    public async saveAsync(event: EventsSaveModel): Promise<EventsModel> {
        return await EventsRepository.saveAsync(event);
    }
}

export default new EventsService();