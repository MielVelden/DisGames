import { TimelineEvent } from "../../interfaces/application/Event";
import { ServersModel, ServersModelFieldEnum, ServersSaveModel } from "../../interfaces/database/TableInterfaces";
import ServerRepository from "../../repositories/ServerRepository";
import { runQueryAsync } from "../../repositories/util/ConnectionHandler";
import Logger from "../../utils/application/Logger";
import { DEFAULT_LANGUAGE } from "../../utils/i18n/MultiLingualString";
import { BaseDomainService } from "./BaseDomainService";
import TimelineBuilder from "./TimelineBuilder";

class ServerService extends BaseDomainService<ServersModel, ServersSaveModel, typeof ServerRepository> {
    protected readonly repository = ServerRepository;
    private static readonly DEFAULT_SERVER_NAME_MAX_LENGTH = 100;
    private serverNameMaxLength: number | null = null;

    private async getServerNameMaxLengthAsync(): Promise<number> {
        if (this.serverNameMaxLength !== null)
            return this.serverNameMaxLength;

        try {
            const result = await runQueryAsync(`
                SELECT CHARACTER_MAXIMUM_LENGTH AS maxLength
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = 'servers'
                  AND COLUMN_NAME = 'Name'
                LIMIT 1
            `);
            const maxLength = Number(result?.[0]?.maxLength);
            this.serverNameMaxLength = Number.isFinite(maxLength) && maxLength > 0
                ? maxLength
                : ServerService.DEFAULT_SERVER_NAME_MAX_LENGTH;
        } catch {
            this.serverNameMaxLength = ServerService.DEFAULT_SERVER_NAME_MAX_LENGTH;
        }

        return this.serverNameMaxLength;
    }

    public async normalizeNameForStorageAsync(name: string): Promise<string> {
        const maxLength = await this.getServerNameMaxLengthAsync();
        return Array.from(name).slice(0, maxLength).join('');
    }

    public async updateNameAsync(serverId: string, name: string): Promise<ServersModel> {
        const server = await this.getByExternalIdAsync(serverId);
        const normalizedName = await this.normalizeNameForStorageAsync(name);
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
        if (savable.Name !== undefined)
            savable.Name = await this.normalizeNameForStorageAsync(savable.Name);
       
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