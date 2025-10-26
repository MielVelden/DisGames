import { GameEvent } from "../../services/events/GameEvent";
import { LogLevel, loggerColors, loggerEmojis } from "../../utils/application/Logger";
import { EmbedConfig } from "../../interfaces/application/DiscordEmbed";

export function createGameEventEmbed(gameEvent: GameEvent, message: string): EmbedConfig {
    return {
        title: `${loggerEmojis[LogLevel.GAME]} Game Event`,
        description: message,
        color: loggerColors[LogLevel.GAME],
        timestamp: new Date().toISOString(),
        fields: [
            {
                name: 'Game',
                value: `${gameEvent.gameConfig.emoji} ${gameEvent.gameConfig.name.getMessage()}`,
                inline: true
            },
            {
                name: 'Player',
                value: `${gameEvent.user.displayName} (${gameEvent.user.userId})`,
                inline: true
            },
            {
                name: 'Points',
                value: gameEvent.gameConfig.points.toString(),
                inline: true
            },
            {
                name: 'Answer',
                value: gameEvent.userInput?.toString() || 'N/A',
                inline: true
            },
            {
                name: 'Guild',
                value: gameEvent.server.ServerId,
                inline: true
            },
            {
                name: 'Event Type',
                value: String(gameEvent.eventType),
                inline: true
            }
        ],
        footer: {
            text: 'DisGames Game Logger'
        }
    };
}

export function createGameErrorEmbed(gameEvent: GameEvent, error: Error): EmbedConfig {
    return {
        title: `${loggerEmojis[LogLevel.ERROR]} Game Error`,
        description: `Error in game: ${gameEvent.gameConfig.name.getMessage()}`,
        color: loggerColors[LogLevel.ERROR],
        timestamp: new Date().toISOString(),
        fields: [
            {
                name: 'Error Message',
                value: error.message,
                inline: false
            },
            {
                name: 'Game',
                value: `${gameEvent.gameConfig.emoji} ${gameEvent.gameConfig.name.getMessage()}`,
                inline: true
            },
            {
                name: 'Player',
                value: `${gameEvent.user.displayName} (${gameEvent.user.userId})`,
                inline: true
            },
            {
                name: 'Guild',
                value: gameEvent.server.ServerId,
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

