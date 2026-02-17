import { Events, Interaction } from "discord.js";
import DiscordService from "../services/discord/DiscordService";
import { DiscordClient } from "../interfaces/application";

export default {
    name: Events.GuildCreate,

    async execute(interaction: Interaction, client: DiscordClient): Promise<void> {
        // Map the interaction to the InteractionEvent interface
        const event = await DiscordService.mapInteractionToInteractionEventAsync(interaction);

        console.log(`Guild created: ${event.guildId}`);
        console.log(event);
    },
};
