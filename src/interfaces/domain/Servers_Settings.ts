export interface Servers_Settings {
    defaultAcceptEmoji?: string;
    defaultRejectEmoji?: string;
    stylesDisabled?: boolean;
    botNickname?: string;
    botAvatarUrl?: string;
    leaderboardLive?: {
        channelId: string;
        messageId: string;
    };
}