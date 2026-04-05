import { EventsModel, EventsModelFieldEnum, EventsSaveModel, getEventsFieldType, RepositoryWithBase } from "../interfaces/database";
import BaseRepository from "./BaseRepository";
import { EventTypeEnum, TableEnum } from "../interfaces/enums/index";
import { Duration } from "../interfaces/application";
import { subtractDurationFromDate } from "../utils/helpers/Duration";
import { TimeframeData } from "../interfaces/view/Dashboard";

class EventRepository implements RepositoryWithBase<EventsModel, EventsSaveModel, typeof EventsModelFieldEnum> {
    public readonly baseRepository: BaseRepository<EventsModel, EventsSaveModel, typeof EventsModelFieldEnum>;

    constructor() {
        this.baseRepository = new BaseRepository<EventsModel, EventsSaveModel, typeof EventsModelFieldEnum>(TableEnum.EVENTS, EventsModelFieldEnum, getEventsFieldType);
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

    async getMessagesSentTimeFrameAsync(duration: Duration): Promise<TimeframeData> {
        const startDate = subtractDurationFromDate(duration, new Date());
        const previousStartDate = subtractDurationFromDate(duration, startDate);
        const currentMessages = await this.baseRepository.Select().Where({ EventTypeEnum: EventTypeEnum.MESSAGE, CreatedAt: { operator: '>=', value: startDate } }).Count();
        const previousMessages = await this.baseRepository.Select().Where({ EventTypeEnum: EventTypeEnum.MESSAGE, CreatedAt: { operator: '>=', value: previousStartDate } }).Count();

        return {
            timeFrame: duration,
            currentValue: currentMessages,
            previousValue: previousMessages - currentMessages
        }
    }

    async getEventsTimeFrameAsync(duration: Duration): Promise<TimeframeData> {
        const startDate = subtractDurationFromDate(duration, new Date());
        const previousStartDate = subtractDurationFromDate(duration, startDate);
        const currentEvents = await this.baseRepository.Select().Where({ CreatedAt: { operator: '>=', value: startDate } }).Count();
        const previousEvents = await this.baseRepository.Select().Where({ CreatedAt: { operator: '>=', value: previousStartDate } }).Count();

        return {
            timeFrame: duration,
            currentValue: currentEvents,
            previousValue: previousEvents - currentEvents
        }
    }

    public async getTotalAsync() {
        return this.baseRepository.Select().Count();
    }
}

export default new EventRepository();