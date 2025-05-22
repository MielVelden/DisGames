import { BaseRepository } from "./util/BaseRepository";
import { Server } from "../interfaces/domain/Server";
import { Language } from "../interfaces/application/Language";
import { ServerEntity } from "../interfaces/entities/ServerEntity";

export class ServerRepository extends BaseRepository<Server, ServerEntity> {
    constructor() {
        super("server", "serverId");
    }
     
    protected mapToModel(entity: ServerEntity): Server {
        return {
            id: entity.id,
            serverId: entity.serverId,
            name: entity.name,
            language: entity.language as Language,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt
        };
    }
    
    protected mapToEntity(model: Server): Partial<ServerEntity> {
        return {
            id: model.id,
            serverId: model.serverId,
            name: model.name,
            language: model.language,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
            games: []
        };
    }
} 