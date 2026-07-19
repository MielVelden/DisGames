import { TimelineEvent } from "../../interfaces/application/Event";
import { ServersModel, ServersModelFieldEnum, ServersSaveModel } from "../../interfaces/database/TableInterfaces";
import { ServerLeaderboardRow } from "../../interfaces/view";
import { MetricEnum } from "../../interfaces/enums";
import ServerRepository from "../../repositories/ServerRepository";
import { TrackMetricPull } from "../../utils/helpers/Decorator";
import { normalizeString } from "../../utils/helpers/String";
import { DEFAULT_LANGUAGE } from "../../utils/i18n/MultiLingualString";
import { BaseDomainService } from "./BaseDomainService";
import TimelineBuilder from "./TimelineBuilder";
import Logger from "../../utils/application/Logger";
import DiscordMemberService from "../discord/DiscordMemberService";
import { PREMIUM_NAME } from "../../utils/application/PremiumAccess";
import packageJson from "../../../package.json";
import { registerService } from "../../utils/container/Container";

export class ServerService extends BaseDomainService<ServersModel, ServersSaveModel, typeof ServerRepository> {
    protected readonly repository = ServerRepository;

    public async initAsync(): Promise<void> {}

    protected async performSaveAsync(savable: ServersSaveModel, event: TimelineEvent): Promise<ServersModel> {
        savable.validateIsNotNull(ServersModelFieldEnum.LanguageEnum, DEFAULT_LANGUAGE);

        var server: ServersModel;
        var entity: ServersModel | null = null;
        if (savable.isProvided(ServersModelFieldEnum.Name))
            savable.Name = normalizeString(savable.Name);

        if (savable.Id)
            entity = await this.repository.getByIdAsync(savable.Id);

        server = await this.repository.saveAsync(savable);

        await TimelineBuilder.forServerUpdateAsync({
            old: entity,
            new: server,
            objectId: server.Id,
            event: event
        });

        event.server = server;
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

        DiscordMemberService.setGuildIdentityAsync(guildId, {
            nickname: packageJson.name + " " + PREMIUM_NAME,
            avatarUrl: null
        });

        Logger.logInfo(`Server ${guildId} granted premium access`, { sendToDiscord: true });
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

        DiscordMemberService.setGuildIdentityAsync(guildId, {
            nickname: null,
            avatarUrl: null
        });

        Logger.logInfo(`Server ${guildId} had premium access revoked`, { sendToDiscord: true });
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

    public async getServersWithLeaderboardLiveAsync(): Promise<ServersModel[]> {
        return await this.repository.getServersWithLeaderboardLiveAsync();
    }

    public async getTopServersByPointsAsync(limit: number = 5): Promise<ServerLeaderboardRow[]> {
        return await this.repository.getTopServersByPointsAsync(limit);
    }
}

const serverService = new ServerService();
registerService(serverService);
export default serverService;