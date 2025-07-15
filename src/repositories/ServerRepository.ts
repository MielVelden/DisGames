import { ServersModel, ServersSaveModel } from "../interfaces/database";
import { Repository } from "../interfaces/database";
import BaseRepository from "./BaseRepository";
import { TableEnum } from "../interfaces/enums/index";

class ServerRepository implements Repository<ServersModel> {
    private baseRepository: BaseRepository<ServersModel, ServersSaveModel>;

    constructor() {
        this.baseRepository = new BaseRepository<ServersModel, ServersSaveModel>(TableEnum.SERVERS);
    }

    async getByIDAsync(id: number): Promise<ServersModel | null> {
        return this.baseRepository.getById(id);
    }

    async getAllAsync(): Promise<ServersModel[]> {
        return this.baseRepository.Select().Execute();
    }

    async saveAsync(model: ServersSaveModel): Promise<ServersModel> {
        return this.baseRepository.Save(model);
    }

    async purgeAsync(id: number): Promise<void> {
        await this.baseRepository.Delete(id);
    }

    async getByServerIdAsync(serverId: string): Promise<ServersModel> {
        const model = await this.baseRepository.Select().Where({ ServerId: serverId }).Limit(1).Execute();
        return model[0];
    }
}

export default new ServerRepository();