import { TimelineEvent } from "../../interfaces/application/Event";
import { ServersModel, ServersModelFieldEnum, ServersSaveModel } from "../../interfaces/database/TableInterfaces";
import ServerRepository from "../../repositories/ServerRepository";
import Logger from "../../utils/application/Logger";
import { normalizeString } from "../../utils/helpers/String";
import { DEFAULT_LANGUAGE } from "../../utils/i18n/MultiLingualString";
import { BaseDomainService } from "./BaseDomainService";
import TimelineBuilder from "./TimelineBuilder";

class ServerService extends BaseDomainService<ServersModel, ServersSaveModel, typeof ServerRepository> {
    protected readonly repository = ServerRepository; 

    public async updateNameAsync(serverId: string, name: string): Promise<ServersModel> {
        const server = await this.getByExternalIdAsync(serverId);
        const normalizedName = normalizeString(name);
        server.Name = normalizedName;
        Logger.logDebug(`Updated server name to ${normalizedName} for server ${serverId}`);
        return await this.repository.saveAsync(server);
    }

    public async updateMemberCountAsync(serverId: string, memberCount: number): Promise<ServersModel> {
        const server = await this.getByExternalIdAsync(serverId);
        server.MemberCount = memberCount;
        Logger.logDebug(`Updated server member count to ${memberCount} for server ${serverId}`);
        return await this.repository.saveAsync(server);
    }

    protected async performSaveAsync(savable: ServersSaveModel, event: TimelineEvent): Promise<ServersModel> {
        savable.validateIsNotNull(ServersModelFieldEnum.LanguageEnum, DEFAULT_LANGUAGE);
        savable.validateIsNotNull(ServersModelFieldEnum.Points, 0);
        
        if (savable.isProvided(ServersModelFieldEnum.Name))
            savable.Name = normalizeString(savable.Name);
       
        const server = await this.repository.saveAsync(savable);      
        event.server = server;

        await TimelineBuilder.forServerUpdateAsync({
            old: null,
            new: server,
            objectId: server.Id,
            event: event
        });
        
        return server;
    }
    
    public async getAllAsync(): Promise<ServersModel[]> {
        return await this.repository.getAllAsync();
    }

    public async purgeAsync(id: number): Promise<void> {
        await this.repository.purgeAsync(id);
    }

    public async getTotalMembersAsync(): Promise<number> {
        return await this.repository.getTotalMembersAsync();
    }
}

export default new ServerService();