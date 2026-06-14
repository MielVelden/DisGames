import { TimelineEvent } from "../../interfaces/application/Event";
import { ServersModel, ServersModelFieldEnum, ServersSaveModel } from "../../interfaces/database/TableInterfaces";
import { MetricEnum } from "../../interfaces/enums";
import ServerRepository from "../../repositories/ServerRepository";
import { TrackMetricPull } from "../../utils/helpers/Decorator";
import { normalizeString } from "../../utils/helpers/String";
import { DEFAULT_LANGUAGE } from "../../utils/i18n/MultiLingualString";
import { BaseDomainService } from "./BaseDomainService";
import TimelineBuilder from "./TimelineBuilder";
import Logger from "../../utils/application/Logger";

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

    public async handlePremiumGrantedAsync(guildId: string): Promise<void> {
        let server: ServersModel | undefined;
        try {
            server = await this.repository.getByServerIdAsync(guildId);
        } catch {
            Logger.logWarning(`handlePremiumGrantedAsync: server ${guildId} not found in database`);
            return;
        }
        if (server.IsPremium)
            return;

        await this.repository.saveAsync(new ServersSaveModel({
            Id: server.Id,
            IsPremium: true
        }));
        Logger.logInfo(`Server ${guildId} granted premium access`);
    }

    public async handlePremiumRevokedAsync(guildId: string): Promise<void> {
        let server: ServersModel | undefined;
        try {
            server = await this.repository.getByServerIdAsync(guildId);
        } catch {
            Logger.logWarning(`handlePremiumRevokedAsync: server ${guildId} not found in database`);
            return;
        }
        if (!server.IsPremium)
            return;

        await this.repository.saveAsync(new ServersSaveModel({
            Id: server.Id,
            IsPremium: false
        }));
        Logger.logInfo(`Server ${guildId} had premium access revoked`);
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