import {
    Guild,
    GuildMember as DiscordGuildMember
} from 'discord.js';

class DiscordMemberService {
    public async fetchMemberAsync(guild: Guild, userId: string): Promise<DiscordGuildMember | null> {
        return await guild.members.fetch(userId);
    }
}

export default new DiscordMemberService();