import { InteractionEvent } from "../../interfaces/application/Event";
import { LogLevel, loggerColors, loggerEmojis } from "../../utils/application/Logger";
import { EmbedConfig } from "../../interfaces/application/DiscordEmbed";

export function createEventEmbed(event: InteractionEvent, message: string): EmbedConfig {
    return {
        title: `${loggerEmojis[LogLevel.EVENT]} Discord Event`,
        description: message,
        color: loggerColors[LogLevel.EVENT],
        timestamp: new Date().toISOString(),
        fields: [
            {
                name: 'Event Type',
                value: String(event.type),
                inline: true
            },
            {
                name: 'User',
                value: `${event.user.displayName} (${event.user.userId})`,
                inline: true
            },
            {
                name: 'Guild',
                value: event.guildId,
                inline: true
            },
            {
                name: 'Channel',
                value: event.channelId,
                inline: true
            },
            {
                name: 'Message ID',
                value: event.messageId,
                inline: true
            },
            {
                name: 'Custom ID',
                value: event.customId || 'N/A',
                inline: true
            }
        ],
        footer: {
            text: 'DisGames Event Logger'
        }
    };
}

export function createEventErrorEmbed(event: InteractionEvent, error: Error): EmbedConfig {
    return {
        title: `${loggerEmojis[LogLevel.ERROR]} Event Error`,
        description: `Error in Discord event: ${String(event.type)}`,
        color: loggerColors[LogLevel.ERROR],
        timestamp: new Date().toISOString(),
        fields: [
            {
                name: 'Error Message',
                value: error.message,
                inline: false
            },
            {
                name: 'Event Type',
                value: String(event.type),
                inline: true
            },
            {
                name: 'User',
                value: `${event.user.displayName} (${event.user.userId})`,
                inline: true
            },
            {
                name: 'Guild',
                value: event.guildId,
                inline: true
            },
            {
                name: 'Channel',
                value: event.channelId,
                inline: true
            },
            {
                name: 'Custom ID',
                value: event.customId || 'N/A',
                inline: true
            },
            {
                name: 'Stack Trace',
                value: `\`\`\`${error.stack?.substring(0, 1000) || 'No stack trace available'}\`\`\``,
                inline: false
            }
        ],
        footer: {
            text: 'DisGames Error Logger'
        }
    };
}

