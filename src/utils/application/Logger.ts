import { InteractionEvent } from '../../interfaces/application/Event';
import { GameEvent } from '../../services/events/GameEvent';
import { DEBUG_MODE } from '../../config';
import { DebugModel, TimelineEntriesModel } from '../../interfaces/database/TableInterfaces';
import Webhook from './Webhook';
import { WebhookType } from '../../interfaces/application';
import { createEventEmbed, createEventErrorEmbed } from '../../builders/embeds/EventEmbed';
import { createGameEventEmbed, createGameErrorEmbed } from '../../builders/embeds/GameEmbed';
import { createDebugEmbed, createDebugCommandEmbed } from '../../builders/embeds/DebugEmbed';
import { createTimelineEmbed } from '../../builders/embeds/TimelineEmbed';
import { createBasicEmbed } from '../../builders/embeds/BasicEmbed';

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
    webhookType?: WebhookType;
}

export const loggerColors = {
    [LogLevel.INFO]: 0x00FF00,      // Green
    [LogLevel.WARNING]: 0xFFA500,   // Orange
    [LogLevel.ERROR]: 0xFF0000,     // Red
    [LogLevel.DEBUG]: 0x808080,     // Gray
    [LogLevel.GAME]: 0x9932CC,      // Purple
    [LogLevel.EVENT]: 0x1E90FF,     // Blue
    [LogLevel.TEST]: 0x00CED1       // DarkTurquoise
};

export const loggerEmojis = {
    [LogLevel.INFO]: '✅',
    [LogLevel.WARNING]: '⚠️',
    [LogLevel.ERROR]: '❌',
    [LogLevel.DEBUG]: '🔍',
    [LogLevel.GAME]: '🎮',
    [LogLevel.EVENT]: '⚡',
    [LogLevel.TEST]: '🧪'
};

class Logger {
    public async logInfo(message: string, options?: LoggerOptions): Promise<void> {
        await this.log(LogLevel.INFO, message, undefined, options);
    }

    public async logWarning(message: string, options?: LoggerOptions): Promise<void> {
        await this.log(LogLevel.WARNING, message, undefined, options);
    }

    public async logError(message: string, error?: Error, options?: LoggerOptions): Promise<void> {
        await this.log(LogLevel.ERROR, message, error, options);
    }

    public async logDebug(message: string, options?: LoggerOptions): Promise<void> {
        if (DEBUG_MODE)
            await this.log(LogLevel.DEBUG, message, undefined, options);
    }

    public async logTest(message: string): Promise<void> {
        // Only log when in debug mode
        if (DEBUG_MODE)
            await this.log(LogLevel.TEST, message);
    }

    public async logEvent(event: InteractionEvent, message: string, options?: LoggerOptions): Promise<void> {
        const embed = createEventEmbed(event, message);
        await Webhook.sendDiscordEmbed(embed);

        if (options?.sendToConsole !== false) {
            console.log(`[${LogLevel.EVENT}] ${message} - User: ${event.user.displayName}, Guild: ${event.guildId}`);
        }
    }

    public async logGameEvent(gameEvent: GameEvent, message: string, options?: LoggerOptions): Promise<void> {
        const embed = createGameEventEmbed(gameEvent, message);
        await Webhook.sendDiscordEmbed(embed);

        if (options?.sendToConsole !== false) {
            console.log(`[${LogLevel.GAME}] ${message} - Game: ${gameEvent.gameConfig.name.getMessage()}, User: ${gameEvent.user.displayName}`);
        }
    }

    public async logGameError(gameEvent: GameEvent, error: Error, options?: LoggerOptions): Promise<void> {
        const embed = createGameErrorEmbed(gameEvent, error);
        await Webhook.sendDiscordEmbed(embed);

        if (options?.sendToConsole !== false) {
            console.error(`[${LogLevel.ERROR}] Game Error - ${error.message}`, error.stack);
        }
    }

    public async logEventError(event: InteractionEvent, error: Error, options?: LoggerOptions): Promise<void> {
        const embed = createEventErrorEmbed(event, error);
        await Webhook.sendDiscordEmbed(embed);

        if (options?.sendToConsole !== false) {
            console.error(`[${LogLevel.ERROR}] Event Error - ${error.message}`, error.stack);
        }
    }

    public async logTimeline(timeline: TimelineEntriesModel, options?: LoggerOptions): Promise<void> {
        const embed = await createTimelineEmbed(timeline);
        await Webhook.sendDiscordEmbed(embed);
    }

    public async logDebugCommand(debugModel: DebugModel, message: string, options?: LoggerOptions): Promise<void> {
        const debugEmbed = await createDebugEmbed(debugModel);
        await Webhook.sendDiscordEmbed(debugEmbed, options?.webhookType ?? WebhookType.DEBUG);

        const commandEmbed = createDebugCommandEmbed(debugModel, message);
        await Webhook.sendDiscordEmbed(commandEmbed, options?.webhookType ?? WebhookType.DEBUG);
    }

    private async log(level: LogLevel, message: string, error?: Error, options?: LoggerOptions): Promise<void> {
        const defaultOptions: LoggerOptions = {
            sendToDiscord: false,
            sendToConsole: true,
            includeStackTrace: level === LogLevel.ERROR,
            webhookType: options?.webhookType
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
            const embed = createBasicEmbed(level, message, error);
            await Webhook.sendDiscordEmbed(embed, finalOptions.webhookType);
        }
    }
}

export default new Logger();