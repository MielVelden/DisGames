import { BaseRepository } from "./util/BaseRepository";
import { Server } from "../interfaces/domain/Server";
import { Language } from "../interfaces/application/Language";

export class ServerRepository extends BaseRepository<Server> {
    constructor() {
        super("server", "serverId");
    }
    
    async getLanguageAsync(serverId: string): Promise<Language> {
        const server = await this.getByExternalIDAsync(serverId);
        return server.language;
    }
    
    protected mapEntityToModel(entity: any): Server {
        return {
            id: entity.id,
            serverId: entity.serverId,
            name: entity.name,
            language: entity.language as Language,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt
        };
    }
    
    protected mapModelToEntity(model: Server): any {
        return {
            serverId: model.serverId,
            name: model.name,
            language: model.language
        };
    }
} 