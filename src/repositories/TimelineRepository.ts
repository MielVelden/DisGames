import { TimelineEntriesModel, TimelineEntriesModelFieldEnum, TimelineEntriesSaveModel } from "../interfaces/database";
import { Repository } from "../interfaces/database";
import BaseRepository from "./BaseRepository";
import { TableEnum, TimelineTypeEnum } from "../interfaces/enums/index";

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
}

export default new TimelineRepository(); 