import { ServersModel, ServersSaveModel } from "../interfaces/database";
import BaseRepository from "./BaseRepository.js";
import { TableEnum } from "../interfaces/enums/index.js";

class ServerRepository {
    private baseRepository: BaseRepository<ServersModel, ServersSaveModel>;

    constructor() {
        this.baseRepository = new BaseRepository<ServersModel, ServersSaveModel>(TableEnum.SERVERS);
    }

    async getAllServersAsync(): Promise<ServersModel[]> {
        return this.baseRepository.Select().Execute();
    }

    async getByServerIdAsync(serverId: string): Promise<ServersModel> {
        const model = await this.baseRepository.Select().Where({ ServerId: serverId }).Limit(1).Execute();
        return model[0];
    }

    async getServerByIdAsync(id: number) {
        const model = await this.baseRepository.Select().Where({ Id: id }).Limit(1).Execute();
        return model[0];
    }

    async save(model: ServersSaveModel): Promise<ServersModel> {
        // TODO: Check if values are valid

        return this.baseRepository.Save(model);
    }
}

export default new ServerRepository();