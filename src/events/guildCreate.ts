import { Events, Guild } from "discord.js";
import DiscordService from "../services/discord/DiscordService";

export default {
    name: Events.GuildCreate,

    async execute(guild: Guild): Promise<void> {
        await DiscordService.handleGuildCreateAsync(guild);
    },
};
