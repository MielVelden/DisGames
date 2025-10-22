import { TimelineEntriesModel, TimelineEntriesModelFieldEnum, TimelineEntriesSaveModel } from "../interfaces/database";
import { Repository } from "../interfaces/database";
import BaseRepository from "./BaseRepository";
import { TableEnum, TimelineTypeEnum } from "../interfaces/enums/index";
import { subtractDurationFromDate } from "../utils/Duration";
import { Duration } from "../interfaces/application";

class TimelineRepository implements Repository<TimelineEntriesModel> {
    private baseRepository: BaseRepository<TimelineEntriesModel, TimelineEntriesSaveModel>;

    constructor() {
        this.baseRepository = new BaseRepository<TimelineEntriesModel, TimelineEntriesSaveModel>(TableEnum.TIMELINE_ENTRIES, TimelineEntriesModelFieldEnum);
    }

    async getByIDAsync(id: number): Promise<TimelineEntriesModel | null> {
        return this.baseRepository.getById(id);
    }

    async getAllAsync(): Promise<TimelineEntriesModel[]> {
        return this.baseRepository.Select().Execute();
    }

    async saveAsync(model: TimelineEntriesSaveModel): Promise<TimelineEntriesModel> {
        return this.baseRepository.Save(model);
    }

    async purgeAsync(id: number): Promise<void> {
        await this.baseRepository.Delete(id);
    }

    async getGamesPlayedAsync(duration: Duration): Promise<number> {
        const startDate = subtractDurationFromDate(duration, new Date());
        return await this.baseRepository.Select().Where({ TimelineType: TimelineTypeEnum.GAME_PLAYED, CreatedAt: { operator: '>=', value: startDate } }).Count();
    }

    async getTotalUsersCreatedAsync(duration: Duration): Promise<number> {
        const startDate = subtractDurationFromDate(duration, new Date());
        return await this.baseRepository.Select().Where({ TimelineType: TimelineTypeEnum.USER_CREATED, CreatedAt: { operator: '>=', value: startDate } }).Count();
    }
}

export default new TimelineRepository(); 