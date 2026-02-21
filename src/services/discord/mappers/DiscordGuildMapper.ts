import { Guild as DiscordGuild } from 'discord.js';
import { GuildCreateEvent, TimelineEvent } from '../../../interfaces/application/Event';
import { User } from '../../../interfaces/domain/User';
import { ServersModel } from '../../../interfaces/database/TableInterfaces';
import TimelineBuilder from '../../domain/TimelineBuilder';
import { TimelineEntriesSaveModel } from '../../../interfaces/database';
import { getOrCreateServerAsync, getTempServer } from './DiscordServerMapper';

function createMinimalTimelineEvent(guild: DiscordGuild, tempServer: ServersModel, botUser: User): TimelineEvent {
    const timelineEntries: TimelineEntriesSaveModel[] = [];
    return {
        user: botUser,
        server: tempServer,
        timelineEntries,
        addTimelineEntry(entry: TimelineEntriesSaveModel): void {
            timelineEntries.push(entry);
        },
        async commitTimelineAsync(): Promise<void> {
            await TimelineBuilder.commitTimelineEntriesAsync(timelineEntries);
        }
    };
}

function getTempBotUser(guild: DiscordGuild): User {
    const bot = guild.client.user;
    if (!bot)
        throw new Error('Guild client user not available');
    return {
        id: undefined,
        userId: bot.id,
        username: bot.username,
        displayName: bot.displayName ?? bot.username,
        bot: true,
        role: undefined as any,
        hasPermissions: () => false,
        hasPermission: () => false,
        sendMessageAsync: async () => {}
    };
}

class DiscordGuildMapper {
    public async mapGuildToGuildCreateEventAsync(guild: DiscordGuild): Promise<GuildCreateEvent> {
        const tempServer = getTempServer(guild);
        const botUser = getTempBotUser(guild);
        const minimalEvent = createMinimalTimelineEvent(guild, tempServer, botUser);
        const server = await getOrCreateServerAsync(guild, minimalEvent);
        return {
            guild,
            server,
            systemChannelId: guild.systemChannelId
        };
    }
}

export default new DiscordGuildMapper();
