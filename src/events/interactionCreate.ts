import {
    Interaction,
    Client,
    Collection,
    Events,
} from 'discord.js';
import DiscordService from '../services/DiscordService';
import { DiscordClient } from '../interfaces/application/DiscordClient';
import { EventType, SlashCommandInteractionEvent } from '../interfaces/application/Event';
import { handleCommand } from '../utils/Commands';
import { EventService } from '../services/EventService';


export default {
    name: Events.InteractionCreate,

    async execute(interaction: Interaction, client: DiscordClient): Promise<void> {
        try {
            // Map the interaction to the InteractionEvent interface
            const event = await DiscordService.mapInteractionToInteractionEventAsync(interaction) as SlashCommandInteractionEvent;

            if (event.type === EventType.SLASH_COMMAND)
                await handleCommand(event.commandName, event);
            else
                await EventService.handleEventAsync(event);
        }
        catch (error) {
            console.error(`Error handling interaction: ${error}`);
        }
    },
};