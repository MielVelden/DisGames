export interface GameData {
    gameId: number;
    serverId: string;
    channelId: string;
    
    messageId?: string;
    lastUserId?: string;

    answer: string | number | boolean;
} 