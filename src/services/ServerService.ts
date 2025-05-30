import { ServersModel } from "../interfaces/database/TableInterfaces";
import { LanguageEnum } from "../interfaces/enums/database/LanguageEnum";
import ServerRepository from "../repositories/ServerRepository";

class ServerService {

    public async getServer(serverId: string, createIfNotExists: boolean = false): Promise<ServersModel> {
        const server = ServerRepository.getByServerIdAsync(serverId);
        if (!server && createIfNotExists) {
            return await ServerRepository.save({
                ServerId: serverId,
                LanguageEnum: LanguageEnum.NL,
                Points: 0,
            });
        }

        return server;
    }

}

export default new ServerService();