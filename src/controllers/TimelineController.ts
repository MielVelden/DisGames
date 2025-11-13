import { Controller } from "../interfaces/application/Controller";
import { TimelineEntriesModel } from "../interfaces/database";
import { User } from "../interfaces/domain";
import TimelineRepository from "../repositories/TimelineRepository";

class TimelineController implements Controller {
    async getByIdAsync(id: number, identity: User): Promise<TimelineEntriesModel> {
        const timeline = await TimelineRepository.getByIdAsync(id);
        return timeline!;
    }

    async getAllAsync(identity: User): Promise<TimelineEntriesModel[]> {
        const timelines = await TimelineRepository.getAllAsync();
        return timelines;
    }
}

export default TimelineController;