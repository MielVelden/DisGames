import { EventsModel, EventsModelFieldEnum, EventsSaveModel } from "../interfaces/database";
import { Repository } from "../interfaces/database";
import BaseRepository from "./BaseRepository";
import { EventTypeEnum, TableEnum } from "../interfaces/enums/index";
import { Duration } from "../interfaces/application";
import { subtractDurationFromDate } from "../utils/helpers/Duration";

class EventsRepository implements Repository<EventsModel> {
    private baseRepository: BaseRepository<EventsModel, EventsSaveModel>;

    constructor() {
        this.baseRepository = new BaseRepository<EventsModel, EventsSaveModel>(TableEnum.EVENTS, EventsModelFieldEnum);
    }

    async getByIdAsync(id: number): Promise<EventsModel | null> {
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

    async getTotalMessagesSentAsync(duration: Duration): Promise<number> {
        const startDate = subtractDurationFromDate(duration, new Date());
        return await this.baseRepository.Select().Where({ EventTypeEnum: EventTypeEnum.MESSAGE, CreatedAt: { operator: '>=', value: startDate } }).Count();
    }
}

export default new EventsRepository();