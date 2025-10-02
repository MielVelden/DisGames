import { EventsModel, EventsModelFieldEnum, EventsSaveModel } from "../interfaces/database";
import { Repository } from "../interfaces/database";
import BaseRepository from "./BaseRepository";
import { TableEnum } from "../interfaces/enums/index";

class EventsRepository implements Repository<EventsModel> {
    private baseRepository: BaseRepository<EventsModel, EventsSaveModel>;

    constructor() {
        this.baseRepository = new BaseRepository<EventsModel, EventsSaveModel>(TableEnum.EVENTS, EventsModelFieldEnum);
    }

    async getByIDAsync(id: number): Promise<EventsModel | null> {
        return this.baseRepository.getById(id);
    }

    async getAllAsync(): Promise<EventsModel[]> {
        return this.baseRepository.Select().Execute();
    }

    async saveAsync(model: EventsSaveModel): Promise<EventsModel> {
        return this.baseRepository.Save(model);
    }

    async purgeAsync(id: number): Promise<void> {
        await this.baseRepository.Delete(id);
    }
}

export default new EventsRepository();