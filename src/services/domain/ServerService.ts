import { ServersModel } from "../../interfaces/database/TableInterfaces";
import { ExceptionEnum } from "../../interfaces/enums";
import { LanguageEnum } from "../../interfaces/enums/database/LanguageEnum";
import ServerRepository from "../../repositories/ServerRepository";
import { ErrorHelper } from "../../utils/Error";
import Logger from "../../utils/Logger";

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

    public async updateNameAsync(serverId: string, name: string): Promise<ServersModel> {
        const server = await this.getServerAsync(serverId);
        if (!server)
            ErrorHelper.throw(ExceptionEnum.SERVER_NOT_FOUND);
        server.Name = name;
        Logger.logDebug(`Updated server name to ${name} for server ${serverId}`);
        return await ServerRepository.saveAsync(server);
    }
}

export default new ServerService();