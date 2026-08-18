export interface Servers_Settings {
    defaultAcceptEmoji?: string;
    defaultRejectEmoji?: string;
    botNickname?: string;
    botAvatarUrl?: string;
    leaderboardLive?: {
        channelId: string;
        messageId: string;
    };
}