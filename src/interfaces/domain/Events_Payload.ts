export interface Events_Payload {
    messageId: string;
    channelId: string;
    guildId: string;
    content?: string;
    commandName?: string;
}