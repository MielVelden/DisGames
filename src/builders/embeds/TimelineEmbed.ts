import { TimelineEntriesModel } from "../../interfaces/database/TableInterfaces";
import { TableEnum, TimelineTypeEnum } from "../../interfaces/enums";
import { LogLevel, loggerColors, loggerEmojis } from "../../utils/application/Logger";
import { getEnumValueByIndex } from "../../utils/helpers/Enum";
import { EmbedConfig } from "../../interfaces/application/DiscordEmbed";
import { formatEmbedFieldValueAsync } from "../../utils/helpers/Embed";

export async function createTimelineEmbed(timeline: TimelineEntriesModel): Promise<EmbedConfig> {
    return {
        title: `${loggerEmojis[LogLevel.DEBUG]} Timeline`,
        description: `New timeline entry`,
        color: loggerColors[LogLevel.DEBUG],
        timestamp: new Date().toISOString(),
        fields: [
            {
                name: 'TableEnum-ObjectID',
                value: `${await formatEmbedFieldValueAsync(getEnumValueByIndex(TableEnum, timeline.TableEnum))} (${await formatEmbedFieldValueAsync(timeline.TableEnum)}), Row: ${await formatEmbedFieldValueAsync(timeline.ObjectId)}`,
                inline: false
            },
            {
                name: 'Timeline Type',
                value: await formatEmbedFieldValueAsync(getEnumValueByIndex(TimelineTypeEnum, timeline.TimelineType)),
                inline: true
            },
            {
                name: 'Changes',
                value: await formatEmbedFieldValueAsync(timeline.Changes),
                inline: false
            },
            {
                name: 'User',
                value: await formatEmbedFieldValueAsync(timeline.UserId, TableEnum.USERS),
                inline: true
            },
            {
                name: 'Server',
                value: await formatEmbedFieldValueAsync(timeline.ServerId, TableEnum.SERVERS),
                inline: true
            }
        ],
        footer: {
            text: 'DisGames Timeline Logger'
        }
    };
}

