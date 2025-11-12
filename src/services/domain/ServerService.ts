import { InteractionEvent } from "../../interfaces/application";
import { ServersModel, ServersSaveModel } from "../../interfaces/database/TableInterfaces";
import { ExceptionEnum } from "../../interfaces/enums";
import { LanguageEnum } from "../../interfaces/enums/database/LanguageEnum";
import ServerRepository from "../../repositories/ServerRepository";
import { ErrorHelper } from "../../utils/application/Error";
import Logger from "../../utils/application/Logger";
import { BaseDomainService } from "./BaseDomainService";
import TimelineBuilder from "./TimelineBuilder";

class ServerService extends BaseDomainService<ServersModel, ServersSaveModel> {
    public async getByIdAsync(id: number): Promise<ServersModel> {
        const server = await ServerRepository.getByIDAsync(id);
        if (!server)
            ErrorHelper.throw(ExceptionEnum.SERVER_NOT_FOUND);
        return server;
    }

    public async getByServerIdAsync(serverId: string, createIfNotExists: boolean = false): Promise<ServersModel> {
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
        const server = await this.getByServerIdAsync(serverId);
        if (!server)
            ErrorHelper.throw(ExceptionEnum.SERVER_NOT_FOUND);
        server.Name = name;
        Logger.logDebug(`Updated server name to ${name} for server ${serverId}`);
        return await ServerRepository.saveAsync(server);
    }

    protected async performSaveAsync(savable: ServersSaveModel, event: InteractionEvent): Promise<ServersModel> {
        const server = await ServerRepository.saveAsync(savable);
        await TimelineBuilder.forServerUpdateAsync({
            old: null,
            new: server,
            objectId: server.Id,
            event: event
        });
        return server;
    }
    
    public async getAllAsync(): Promise<ServersModel[]> {
        return await ServerRepository.getAllAsync();
    }

    public async purgeAsync(id: number): Promise<void> {
        await ServerRepository.purgeAsync(id);
    }
}

export default new ServerService();