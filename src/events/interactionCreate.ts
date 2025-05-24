import {
    Interaction,
    Client,
    Collection,
    Events,
} from 'discord.js';
import DiscordService from '../services/DiscordService';
import { DiscordClient } from '../interfaces/application/DiscordClient';
import { SlashCommandInteractionEvent } from '../interfaces/application/Event';


export default {
    name: Events.InteractionCreate,

    async execute(interaction: Interaction, client: DiscordClient): Promise<void> {
        try {
            console.log(interaction);
            // Map the interaction to the InteractionEvent interface
            const interactionEvent = await DiscordService.mapInteractionToInteractionEventAsync(interaction) as SlashCommandInteractionEvent;
            const command = client.commands.get(interactionEvent.commandName);
            if (!command) return;
            await command.executeAsync(interactionEvent);
            console.log("interactionEvent", interactionEvent);
        }
        catch (error) {
            console.error(`Error handling interaction: ${error}`);
        }
    },
};