import {
    Interaction,
    Client,
    Collection,
    Events,
    Message,
} from 'discord.js';
import DiscordService from '../services/DiscordService';
import { MessageInteractionEvent } from '../interfaces/application/Event';
import GameService from '../services/GameService';

export default {
    name: Events.MessageCreate,

    async execute(message: Message, client: Client): Promise<void> {
        try {
            if (message.author.bot)
                return;

            const event = await DiscordService.mapMessageToInteractionEventAsync(message) as MessageInteractionEvent;
            await GameService.handleGameAsync(event);
        }
        catch (error) {
            console.error(`Error handling interaction: ${error}`);
        }
    },
};