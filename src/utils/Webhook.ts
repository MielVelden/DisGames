import axios from 'axios';
import { DEBUG_DISCORD_WEBHOOK_URL, DISCORD_WEBHOOK_URL } from '../config';
import { LogLevel, loggerColors, loggerEmojis } from './Logger';
import { InteractionEvent } from '../interfaces/application/Event';
import { GameEvent } from '../interfaces/domain/Game';
import { DebugModel, TimelineEntriesSaveModel } from '../interfaces/database/TableInterfaces';
import { TableEnum } from '../interfaces/enums';
import { RepositoryUtils } from '../repositories/BaseRepository';
import { FunctionEnum } from '../interfaces/enums/database/FunctionEnum';
import { i18n } from './i18n/i18n';

export enum WebhookType {
    INFO = 'INFO',
    DEBUG = 'DEBUG',
}

class Webhook {
    public static async sendDiscordEmbed(embed: any, webhookType: WebhookType = WebhookType.INFO): Promise<void> {
        if (!DISCORD_WEBHOOK_URL)
            return;

        let webhookUrl: string = DISCORD_WEBHOOK_URL;
        switch (webhookType) {
            case WebhookType.DEBUG:
                if (DEBUG_DISCORD_WEBHOOK_URL)
                    webhookUrl = DEBUG_DISCORD_WEBHOOK_URL;
                break;
            default:
                webhookUrl = DISCORD_WEBHOOK_URL;
        }

        try {
            await axios.post(webhookUrl, {
                embeds: [embed]
            });
        } catch (error) {
            console.error('[Webhook] Failed to send Discord webhook:', error);
        }
    }

    public static createEventTemplate(event: InteractionEvent, message: string): any {
        return {
            title: `${loggerEmojis[LogLevel.EVENT]} Discord Event`,
            description: message,
            color: loggerColors[LogLevel.EVENT],
            timestamp: new Date().toISOString(),
            fields: [
                {
                    name: 'Event Type',
                    value: event.type,
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

    public static createGameEventTemplate(gameEvent: GameEvent, message: string): any {
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

    public static createGameErrorTemplate(gameEvent: GameEvent, error: Error): any {
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

    public static createEventErrorTemplate(event: InteractionEvent, error: Error): any {
        return {
            title: `${loggerEmojis[LogLevel.ERROR]} Event Error`,
            description: `Error in Discord event: ${event.type}`,
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
                    value: event.type,
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

    public static async createTimelineTemplate(timeline: TimelineEntriesSaveModel): Promise<any> {
        const formatFieldValueAsync = async (value: unknown, table?: TableEnum): Promise<string> => {
            if (value === null || value === undefined)
                return 'N/A';

            if (typeof value === 'object') {
                const json = JSON.stringify(value, null, 2) ?? '{}';
                const clipped = json.length > 1000 ? json.slice(0, 1000) + '…' : json;
                return '```json\n' + clipped + '\n```';
            }

            const str = String(value);
            if (table) {
                const result = await RepositoryUtils.CallFunctionGeneric(FunctionEnum.Getdisplayname, [table, value]);
                return result;
            }

            return str.length > 1024 ? str.slice(0, 1021) + '…' : str;
        };

        return {
            title: `${loggerEmojis[LogLevel.DEBUG]} Timeline`,
            description: `New timeline entry`,
            color: loggerColors[LogLevel.DEBUG],
            timestamp: new Date().toISOString(),
            fields: [
                {
                    name: 'TableEnum-ObjectID',
                    value: `${await formatFieldValueAsync(timeline.TableEnum)}-${await formatFieldValueAsync(timeline.ObjectId)}`,
                    inline: false
                },
                {
                    name: 'Timeline Type',
                    value: await formatFieldValueAsync(timeline.TimelineType),
                    inline: true
                },
                {
                    name: 'Changes',
                    value: await formatFieldValueAsync(timeline.ChangesJSON),
                    inline: false
                },
                {
                    name: 'User',
                    value: await formatFieldValueAsync(timeline.UserId, TableEnum.USERS),
                    inline: true
                },
                {
                    name: 'Server',
                    value: await formatFieldValueAsync(timeline.ServerId, TableEnum.SERVERS),
                    inline: true
                }
            ],
            footer: {
                text: 'DisGames Timeline Logger'
            }
        };
    }

    public static createDebugTemplate(debugModel: DebugModel): any {
        const dataJson = JSON.stringify(debugModel.Data ?? {}, null, 2);
        const clipped = dataJson.length > 1000 ? dataJson.slice(0, 1000) + '…' : dataJson;

        return {
            title: `${loggerEmojis[LogLevel.DEBUG]} ${LogLevel.DEBUG.toUpperCase()}`,
            description: 'Received debug data',
            color: loggerColors[LogLevel.DEBUG],
            timestamp: new Date().toISOString(),
            fields: [
                {
                    name: 'ID',
                    value: String(debugModel.Id ?? 'N/A'),
                    inline: true
                },
                {
                    name: 'Unique Code',
                    value: debugModel.UniqueCode ?? 'N/A',
                    inline: true
                },
                {
                    name: 'Server ID',
                    value: String(debugModel.ServerId ?? 'N/A'),
                    inline: true
                },
                {
                    name: 'Created At',
                    value: debugModel.CreatedAt ? new Date(debugModel.CreatedAt).toISOString() : 'N/A',
                    inline: true
                },
                {
                    name: 'Payload',
                    value: '```json\n' + clipped + '\n```',
                    inline: false
                }
            ],
            footer: {
                text: 'DisGames Debug Logger'
            }
        };
    }

    public static createDebugCommandTemplate(debugModel: DebugModel, message: string): any {
        return {
            title: `${loggerEmojis[LogLevel.DEBUG]} ${LogLevel.DEBUG.toUpperCase()}`,
            description: `\`${i18n.commands.debug.labels.description(message).getMessage()}\``,
            color: loggerColors[LogLevel.DEBUG],
            timestamp: new Date().toISOString(),
            footer: {
                text: 'Debug Command Logger'
            },
            fields: [] as any[]
        };
    }

    public static createBasicEmbed(level: LogLevel, message: string, error?: Error): any {
        const embed = {
            title: `${loggerEmojis[level]} ${level.toUpperCase()}`,
            description: message,
            color: loggerColors[level],
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
}

export default Webhook;
