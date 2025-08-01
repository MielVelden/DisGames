import { TimelineEntriesModel, TimelineEntriesSaveModel } from "../interfaces/database";
import { Repository } from "../interfaces/database";
import BaseRepository from "./BaseRepository";
import { TableEnum, TimelineTypeEnum } from "../interfaces/enums/index";

class TimelineRepository implements Repository<TimelineEntriesModel> {
    private baseRepository: BaseRepository<TimelineEntriesModel, TimelineEntriesSaveModel>;

    constructor() {
        this.baseRepository = new BaseRepository<TimelineEntriesModel, TimelineEntriesSaveModel>(TableEnum.TIMELINE_ENTRIES);
    }

    async getByIDAsync(id: number): Promise<TimelineEntriesModel | null> {
        const model = await this.baseRepository.getById(id);
        if (!model)
            return null;
        
        model.Changes = JSON.parse(model.Changes);
        return model;
    }

    async getAllAsync(): Promise<TimelineEntriesModel[]> {
        return this.baseRepository.Select().Execute();
    }

    async saveAsync(model: TimelineEntriesSaveModel): Promise<TimelineEntriesModel> {
        // Make sure the changes are serialized
        model.Changes = JSON.stringify(model.Changes);
        return this.baseRepository.Save(model);
    }

    async purgeAsync(id: number): Promise<void> {
        await this.baseRepository.Delete(id);
    }
}

export default new TimelineRepository(); 