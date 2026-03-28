import { getTimelineEntriesFieldType, TimelineEntriesModel, TimelineEntriesModelFieldEnum, TimelineEntriesSaveModel, RepositoryWithBase } from "../interfaces/database";
import BaseRepository from "./BaseRepository";
import { TableEnum, TimelineTypeEnum } from "../interfaces/enums/index";
import { subtractDurationFromDate } from "../utils/helpers/Duration";
import { Duration } from "../interfaces/application";
import { TimeframeData as TimeFrameData } from "../interfaces/view/Dashboard";

class TimelineRepository implements RepositoryWithBase<TimelineEntriesModel, TimelineEntriesSaveModel, typeof TimelineEntriesModelFieldEnum> {
    public readonly baseRepository: BaseRepository<TimelineEntriesModel, TimelineEntriesSaveModel, typeof TimelineEntriesModelFieldEnum>;

    constructor() {
        this.baseRepository = new BaseRepository<TimelineEntriesModel, TimelineEntriesSaveModel, typeof TimelineEntriesModelFieldEnum>(TableEnum.TIMELINE_ENTRIES, TimelineEntriesModelFieldEnum, getTimelineEntriesFieldType);
    }

    async getByIdAsync(id: number): Promise<TimelineEntriesModel | null> {
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

    async getGamesPlayedTimeFrameAsync(duration: Duration): Promise<TimeFrameData> {
        const startDate = subtractDurationFromDate(duration, new Date());
        const previousStartDate = subtractDurationFromDate(duration, startDate);
        const currentGamesPlayed = await this.baseRepository.Select().Where({ TimelineType: TimelineTypeEnum.GAME_PLAYED, CreatedAt: { operator: '>=', value: startDate } }).Count();
        const previousGamesPlayed = await this.baseRepository.Select().Where({ TimelineType: TimelineTypeEnum.GAME_PLAYED, CreatedAt: { operator: '>=', value: previousStartDate } }).Count();

        return {
            timeFrame: duration,
            currentValue: currentGamesPlayed,
            previousValue: previousGamesPlayed - currentGamesPlayed
        }
    }

    async getUsersTimeFrameAsync(duration: Duration): Promise<TimeFrameData> {
        const startDate = subtractDurationFromDate(duration, new Date());
        const previousStartDate = subtractDurationFromDate(duration, startDate);
        const currentUsers = await this.baseRepository.Select().Where({ TimelineType: TimelineTypeEnum.USER_CREATED, CreatedAt: { operator: '>=', value: startDate } }).Count();
        const previousUsers = await this.baseRepository.Select().Where({ TimelineType: TimelineTypeEnum.USER_CREATED, CreatedAt: { operator: '>=', value: previousStartDate } }).Count();

        return {
            timeFrame: duration,
            currentValue: currentUsers,
            previousValue: previousUsers - currentUsers
        }
    }

    async getServersTimeFrameAsync(duration: Duration): Promise<TimeFrameData> {
        const startDate = subtractDurationFromDate(duration, new Date());
        const previousStartDate = subtractDurationFromDate(duration, startDate);
        const currentServers = await this.baseRepository.Select().Where({ TimelineType: TimelineTypeEnum.SERVER_CREATED, CreatedAt: { operator: '>=', value: startDate } }).Count();
        const previousServers = await this.baseRepository.Select().Where({ TimelineType: TimelineTypeEnum.SERVER_CREATED, CreatedAt: { operator: '>=', value: previousStartDate } }).Count();

        return {
            timeFrame: duration,
            currentValue: currentServers,
            previousValue: previousServers - currentServers
        }
    }
}

export default new TimelineRepository(); 