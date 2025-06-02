import {
    Client,
    Events,
    Message,
} from 'discord.js';
import DiscordService from '../services/DiscordService';
import { MessageInteractionEvent, EventType as EventTypeEnum } from '../interfaces/application/Event';
import GameService from '../services/GameService';

export default {
    name: Events.MessageUpdate,

    async execute(message: Message, client: Client): Promise<void> {
        try {
            if (message.author.bot)
                return;

            const event = await DiscordService.mapMessageToInteractionEventAsync(message, EventTypeEnum.MESSAGE_UPDATE) as MessageInteractionEvent;
            await GameService.handleGameAsync(event);
        }
        catch (error) {
            console.error(`Error handling interaction: ${error}`);
        }
    },
};