import { Guild as DiscordGuild } from 'discord.js';
import { GuildCreateEvent } from '../../../interfaces/application/Event';
import { User } from '../../../interfaces/domain/User';
import { getOrCreateServerAsync, getTempServer } from './DiscordServerMapper';
import { createBaseTimelineEvent } from '../../../utils/helpers/Timeline';

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
        const minimalEvent = createBaseTimelineEvent(botUser, tempServer);
        const server = await getOrCreateServerAsync(guild, minimalEvent);
        return {
            guild,
            server,
            systemChannelId: guild.systemChannelId
        };
    }
}

export default new DiscordGuildMapper();
