import { ServersModel } from "../interfaces/database/TableInterfaces";
import { LanguageEnum } from "../interfaces/enums/database/LanguageEnum";
import ServerRepository from "../repositories/ServerRepository";

class ServerService {
    public async getServerAsync(serverId: string, createIfNotExists: boolean = false): Promise<ServersModel> {
        const server = await ServerRepository.getByServerIdAsync(serverId);
        if (!server && createIfNotExists) {
            return await ServerRepository.saveAsync({
                ServerId: serverId,
                LanguageEnum: LanguageEnum.NL,
                Points: 0,
            });
        }

        return server;
    }
}

export default new ServerService();