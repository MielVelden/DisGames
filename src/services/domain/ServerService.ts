import { TimelineEvent } from "../../interfaces/application/Event";
import { ServersModel, ServersModelFieldEnum, ServersSaveModel } from "../../interfaces/database/TableInterfaces";
import { MetricEnum } from "../../interfaces/enums";
import ServerRepository from "../../repositories/ServerRepository";
import { TrackMetricPull } from "../../utils/helpers/Decorator";
import { normalizeString } from "../../utils/helpers/String";
import { DEFAULT_LANGUAGE } from "../../utils/i18n/MultiLingualString";
import { BaseDomainService } from "./BaseDomainService";
import TimelineBuilder from "./TimelineBuilder";

class ServerService extends BaseDomainService<ServersModel, ServersSaveModel, typeof ServerRepository> {
    protected readonly repository = ServerRepository; 

    protected async performSaveAsync(savable: ServersSaveModel, event: TimelineEvent): Promise<ServersModel> {
        savable.validateIsNotNull(ServersModelFieldEnum.LanguageEnum, DEFAULT_LANGUAGE);
        
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

    @TrackMetricPull(MetricEnum.Servers)
    public async getTotalAsync(): Promise<number> {
        return await this.repository.getTotalAsync();
    }

    @TrackMetricPull(MetricEnum.ServerMembers)
    public async getTotalServerMembersAsync(): Promise<number> {
        return await this.repository.getTotalServerMembersAsync();
    }
}

export default new ServerService();