import { IEntity } from "../database/IEntity";

export interface GameData extends IEntity {
    gameId: number;
    serverId: string;
    channelId: string;
    
    messageId?: string;
    lastUserId?: string;

    answer: string | number | boolean;
} 