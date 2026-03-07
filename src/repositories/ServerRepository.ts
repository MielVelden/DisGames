import { getServersFieldType, ServersModel, ServersModelFieldEnum, ServersSaveModel, RepositoryWithBase } from "../interfaces/database";
import BaseRepository from "./BaseRepository";
import { ExceptionEnum, TableEnum } from "../interfaces/enums/index";
import { ComponentError } from "../utils/application/Error";

class ServerRepository implements RepositoryWithBase<ServersModel, ServersSaveModel, typeof ServersModelFieldEnum> {
    public readonly baseRepository: BaseRepository<ServersModel, ServersSaveModel, typeof ServersModelFieldEnum>;

    constructor() {
        this.baseRepository = new BaseRepository<ServersModel, ServersSaveModel, typeof ServersModelFieldEnum>(TableEnum.SERVERS, ServersModelFieldEnum, getServersFieldType);
    }

    async getByIdAsync(id: number): Promise<ServersModel | null> {
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
        if (!model || model.length === 0)
            throw new ComponentError({
                message: ExceptionEnum.RECORD_NOT_FOUND
            });
        return model[0];
    }

    async getTotalMembersAsync(): Promise<number> {
        return await this.baseRepository.Select().Sum("MemberCount");
    }
}

export default new ServerRepository();