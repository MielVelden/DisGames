import axios from 'axios';
import { InteractionEvent } from '../interfaces/application/Event';
import { GameEvent } from '../interfaces/domain/Game';
import { DEBUG_MODE, DISCORD_WEBHOOK_URL } from '../config';

export enum LogLevel {
    INFO = 'INFO',
    WARNING = 'WARNING',
    ERROR = 'ERROR',
    DEBUG = 'DEBUG',
    GAME = 'GAME',
    EVENT = 'EVENT',
    TEST = 'TEST'
}

export interface LoggerOptions {
    sendToDiscord?: boolean;
    sendToConsole?: boolean;
    includeStackTrace?: boolean;
}

class Logger {
    private static readonly colors = {
        [LogLevel.INFO]: 0x00FF00,      // Green
        [LogLevel.WARNING]: 0xFFA500,   // Orange
        [LogLevel.ERROR]: 0xFF0000,     // Red
        [LogLevel.DEBUG]: 0x808080,     // Gray
        [LogLevel.GAME]: 0x9932CC,      // Purple
        [LogLevel.EVENT]: 0x1E90FF,     // Blue
        [LogLevel.TEST]: 0x00CED1       // DarkTurquoise
    };

    private static readonly emojis = {
        [LogLevel.INFO]: '✅',
        [LogLevel.WARNING]: '⚠️',
        [LogLevel.ERROR]: '❌',
        [LogLevel.DEBUG]: '🔍',
        [LogLevel.GAME]: '🎮',
        [LogLevel.EVENT]: '⚡',
        [LogLevel.TEST]: '🧪'
    };

    public static async logInfo(message: string, options?: LoggerOptions): Promise<void> {
        await this.log(LogLevel.INFO, message, undefined, options);
    }

    public static async logWarning(message: string, options?: LoggerOptions): Promise<void> {
        await this.log(LogLevel.WARNING, message, undefined, options);
    }

    public static async logError(message: string, error?: Error, options?: LoggerOptions): Promise<void> {
        await this.log(LogLevel.ERROR, message, error, options);
    }

    public static async logDebug(message: string, options?: LoggerOptions): Promise<void> {
        if (DEBUG_MODE)
            await this.log(LogLevel.DEBUG, message, undefined, options);
    }

    public static async logTest(message: string): Promise<void> {
        // Only log when in debug mode
        if (DEBUG_MODE)
            await this.log(LogLevel.TEST, message);
    }

    public static async logEvent(event: InteractionEvent, message: string, options?: LoggerOptions): Promise<void> {
        const template = this.createEventTemplate(event, message);
        await this.sendDiscordEmbed(template, LogLevel.EVENT, options);
        
        if (options?.sendToConsole !== false) {
            console.log(`[${LogLevel.EVENT}] ${message} - User: ${event.user.displayName}, Guild: ${event.guildId}`);
        }
    }

    public static async logGameEvent(gameEvent: GameEvent, message: string, options?: LoggerOptions): Promise<void> {
        const template = this.createGameEventTemplate(gameEvent, message);
        await this.sendDiscordEmbed(template, LogLevel.GAME, options);
        
        if (options?.sendToConsole !== false) {
            console.log(`[${LogLevel.GAME}] ${message} - Game: ${gameEvent.gameConfig.name.getMessage()}, User: ${gameEvent.user.displayName}`);
        }
    }

    public static async logGameError(gameEvent: GameEvent, error: Error, options?: LoggerOptions): Promise<void> {
        const template = this.createGameErrorTemplate(gameEvent, error);
        await this.sendDiscordEmbed(template, LogLevel.ERROR, options);
        
        if (options?.sendToConsole !== false) {
            console.error(`[${LogLevel.ERROR}] Game Error - ${error.message}`, error.stack);
        }
    }

    public static async logEventError(event: InteractionEvent, error: Error, options?: LoggerOptions): Promise<void> {
        const template = this.createEventErrorTemplate(event, error);
        await this.sendDiscordEmbed(template, LogLevel.ERROR, options);
        
        if (options?.sendToConsole !== false) {
            console.error(`[${LogLevel.ERROR}] Event Error - ${error.message}`, error.stack);
        }
    }

    private static async log(level: LogLevel, message: string, error?: Error, options?: LoggerOptions): Promise<void> {
        const defaultOptions: LoggerOptions = {
            sendToDiscord: false,
            sendToConsole: true,
            includeStackTrace: level === LogLevel.ERROR
        };
        const finalOptions = { ...defaultOptions, ...options };

        if (finalOptions.sendToConsole) {
            const logFunction = level === LogLevel.ERROR ? console.error : 
                               level === LogLevel.WARNING ? console.warn : console.log;
            logFunction(`[${level}] ${message}${error ? `: ${error.message}` : ''}`);
            
            if (error && finalOptions.includeStackTrace) {
                console.error(error.stack);
            }
        }

        if (finalOptions.sendToDiscord) {
            const embed = this.createBasicEmbed(level, message, error);
            await this.sendDiscordEmbed(embed, level, finalOptions);
        }
    }

    private static createEventTemplate(event: InteractionEvent, message: string): any {
        return {
            title: `${this.emojis[LogLevel.EVENT]} Discord Event`,
            description: message,
            color: this.colors[LogLevel.EVENT],
            timestamp: new Date().toISOString(),
            fields: [
                {
                    name: 'Event Type',
                    value: event.type,
                    inline: true
                },
                {
                    name: 'User',
                    value: `${event.user.displayName} (${event.user.id})`,
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

    private static createGameEventTemplate(gameEvent: GameEvent, message: string): any {
        return {
            title: `${this.emojis[LogLevel.GAME]} Game Event`,
            description: message,
            color: this.colors[LogLevel.GAME],
            timestamp: new Date().toISOString(),
            fields: [
                {
                    name: 'Game',
                    value: `${gameEvent.gameConfig.emoji} ${gameEvent.gameConfig.name.getMessage()}`,
                    inline: true
                },
                {
                    name: 'Player',
                    value: `${gameEvent.user.displayName} (${gameEvent.user.id})`,
                    inline: true
                },
                {
                    name: 'Points',
                    value: gameEvent.gameConfig.points.toString(),
                    inline: true
                },
                {
                    name: 'Answer',
                    value: gameEvent.answer?.toString() || 'N/A',
                    inline: true
                },
                {
                    name: 'Guild',
                    value: gameEvent.server.ServerId,
                    inline: true
                },
                {
                    name: 'Event Type',
                    value: gameEvent.eventType,
                    inline: true
                }
            ],
            footer: {
                text: 'DisGames Game Logger'
            }
        };
    }

    private static createGameErrorTemplate(gameEvent: GameEvent, error: Error): any {
        return {
            title: `${this.emojis[LogLevel.ERROR]} Game Error`,
            description: `Error in game: ${gameEvent.gameConfig.name.getMessage()}`,
            color: this.colors[LogLevel.ERROR],
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
                    value: `${gameEvent.user.displayName} (${gameEvent.user.id})`,
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

    private static createEventErrorTemplate(event: InteractionEvent, error: Error): any {
        return {
            title: `${this.emojis[LogLevel.ERROR]} Event Error`,
            description: `Error in Discord event: ${event.type}`,
            color: this.colors[LogLevel.ERROR],
            timestamp: new Date().toISOString(),
            fields: [
                {
                    name: 'Error Message',
                    value: error.message,
                    inline: false
                },
                {
                    name: 'Event Type',
                    value: event.type,
                    inline: true
                },
                {
                    name: 'User',
                    value: `${event.user.displayName} (${event.user.id})`,
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

    private static createBasicEmbed(level: LogLevel, message: string, error?: Error): any {
        const embed = {
            title: `${this.emojis[level]} ${level}`,
            description: message,
            color: this.colors[level],
            timestamp: new Date().toISOString(),
            footer: {
                text: 'DisGames Logger'
            },
            fields: [] as any[]
        };

        if (error) {
            embed.fields.push({
                name: 'Error Details',
                value: error.message,
                inline: false
            });

            if (error.stack) {
                embed.fields.push({
                    name: 'Stack Trace',
                    value: `\`\`\`${error.stack.substring(0, 1000)}\`\`\``,
                    inline: false
                });
            }
        }

        return embed;
    }

    private static async sendDiscordEmbed(embed: any, level: LogLevel, options?: LoggerOptions): Promise<void> {
        if (!DISCORD_WEBHOOK_URL || options?.sendToDiscord === false) {
            return;
        }

        try {
            await axios.post(DISCORD_WEBHOOK_URL, {
                embeds: [embed]
            });
        } catch (error) {
            console.error('[Logger] Failed to send Discord webhook:', error);
        }
    }
}

export default Logger;