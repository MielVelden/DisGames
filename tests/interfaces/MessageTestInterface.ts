export interface TestMessage {
    id: string;
    content: string;
    authorId: string;
    channelId: string;
    guildId: string;
    timestamp?: Date;
}