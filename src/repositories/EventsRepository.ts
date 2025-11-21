import { EventsModel, EventsModelFieldEnum, EventsSaveModel, RepositoryWithBase } from "../interfaces/database";
import BaseRepository from "./BaseRepository";
import { EventTypeEnum, TableEnum } from "../interfaces/enums/index";
import { Duration } from "../interfaces/application";
import { subtractDurationFromDate } from "../utils/helpers/Duration";
import { TimeframeData } from "../interfaces/view/Dashboard";

class EventsRepository implements RepositoryWithBase<EventsModel, EventsSaveModel> {
    public readonly baseRepository: BaseRepository<EventsModel, EventsSaveModel>;

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

    async getMessagesSentTimeFrameAsync(duration: Duration): Promise<TimeframeData> {
        const startDate = subtractDurationFromDate(duration, new Date());
        const previousStartDate = subtractDurationFromDate(duration, startDate);
        const currentMessages = await this.baseRepository.Select().Where({ EventTypeEnum: EventTypeEnum.MESSAGE, CreatedAt: { operator: '>=', value: startDate } }).Count();
        const previousMessages = await this.baseRepository.Select().Where({ EventTypeEnum: EventTypeEnum.MESSAGE, CreatedAt: { operator: '>=', value: previousStartDate } }).Count();

        return {
            timeFrame: duration,
            currentValue: currentMessages,
            previousValue: previousMessages
        }
    }
}

export default new EventsRepository();