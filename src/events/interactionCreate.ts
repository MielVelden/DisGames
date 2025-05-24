import {
    Interaction,
    Client,
    Collection,
    ButtonInteraction,
    StringSelectMenuInteraction,
    Events,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    TextInputStyle,
    ChatInputCommandInteraction,
    MessageContextMenuCommandInteraction,
    UserContextMenuCommandInteraction,
    AnySelectMenuInteraction,
    AutocompleteInteraction,
    ModalSubmitInteraction
} from 'discord.js';
import { EventService } from '../services/EventService';
import { InteractionEvent } from '../interfaces/application/Event';
import DiscordService from '../services/DiscordService';


export default {
    name: Events.InteractionCreate,

    async execute(interaction: Interaction, client: Client, commands: Collection<string, any>): Promise<void> {
        try {
            // Map the interaction to the InteractionEvent interface
            const interactionEvent = await DiscordService.mapInteractionToInteractionEventAsync(interaction);


        }
        catch (error) {
            console.error(`Error handling interaction: ${error}`);
        }
    },
};