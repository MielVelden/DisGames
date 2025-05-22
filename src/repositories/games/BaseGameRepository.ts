import { BaseRepository } from "../util/BaseRepository";
import { GameData } from "../../interfaces/domain/GameData";
import { GameDataEntity } from "../../interfaces/entities/GameDataEntity";

export class BaseGameDataRepository extends BaseRepository<GameData, GameDataEntity> {
    constructor() {
        super("gameData", "gameId");
    }
     
    protected mapToModel(entity: GameDataEntity): GameData {
        return {
            id: entity.id,
            gameId: entity.gameId,
            serverId: entity.serverId,
            channelId: entity.channelId,
            messageId: entity.messageId,
            lastUserId: entity.lastUserId,
            answer: entity.answer as string,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt
        };
    }
    
    protected mapToEntity(model: GameData): Partial<GameDataEntity> {
        return {
            id: model.id,
            gameId: model.gameId,
            serverId: model.serverId,
            channelId: model.channelId,
            messageId: model.messageId,
            lastUserId: model.lastUserId,
            answer: model.answer as string,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt
        };
    }
} 