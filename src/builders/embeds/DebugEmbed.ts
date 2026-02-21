import { DebugModel } from "../../interfaces/database/TableInterfaces";
import { TableEnum } from "../../interfaces/enums";
import { LogLevel, loggerColors, loggerEmojis } from "../../utils/application/Logger";
import { i18n } from "../../utils/i18n/i18n";
import { EmbedConfig } from "../../interfaces/application/DiscordEmbed";
import { formatEmbedFieldValueAsync } from "../../utils/helpers/Embed";
import { toonEncode } from "../../utils/helpers/Toon";

export async function createDebugEmbed(debugModel: DebugModel): Promise<EmbedConfig> {
    const dataToon = toonEncode(debugModel.Data ?? {});
    const clipped = dataToon.length > 1000 ? dataToon.slice(0, 1000) + '…' : dataToon;

    return {
        title: `${loggerEmojis[LogLevel.DEBUG]} ${LogLevel.DEBUG.toUpperCase()}`,
        description: 'Received debug data',
        color: loggerColors[LogLevel.DEBUG],
        timestamp: new Date().toISOString(),
        fields: [
            {
                name: 'ID',
                value: await formatEmbedFieldValueAsync(debugModel.Id),
                inline: true
            },
            {
                name: 'Unique Code',
                value: await formatEmbedFieldValueAsync(debugModel.UniqueCode),
                inline: true
            },
            {
                name: 'Server ID',
                value: await formatEmbedFieldValueAsync(debugModel.ServerId, TableEnum.SERVERS),
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

export function createDebugCommandEmbed(debugModel: DebugModel, message: string): EmbedConfig {
    return {
        title: `${loggerEmojis[LogLevel.DEBUG]} ${LogLevel.DEBUG.toUpperCase()}`,
        description: `\`${i18n.commands.debug.labels.description(message).getMessage()}\``,
        color: loggerColors[LogLevel.DEBUG],
        timestamp: new Date().toISOString(),
        footer: {
            text: 'Debug Command Logger'
        },
        fields: []
    };
}

