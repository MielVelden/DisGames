import { Events, Guild } from "discord.js";
import DiscordService from "../services/discord/DiscordService";
import { DiscordClient } from "../interfaces/application";

export default {
    name: Events.GuildCreate,

    async execute(guild: Guild, client: DiscordClient): Promise<void> {
        await DiscordService.handleGuildCreateAsync(guild);
    },
};
