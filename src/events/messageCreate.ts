import {
    Client,
    Events,
    Message,
} from 'discord.js';
import DiscordService from '../services/DiscordService';
import { MessageInteractionEvent, EventTypeEnum } from '../interfaces/application/Event';
import GameService from '../services/GameService';

export default {
    name: Events.MessageCreate,

    async execute(message: Message, client: Client): Promise<void> {
        await handleMessageCreateAsync(message, EventTypeEnum.MESSAGE);
    },
};

export async function handleMessageCreateAsync(message: Message, eventType: EventTypeEnum): Promise<void> {
    try {
        if (message.author.bot)
            return;

        const event = await DiscordService.mapMessageToInteractionEventAsync(message, eventType) as MessageInteractionEvent;
        await GameService.handleGameAsync(event);
    }
    catch (error) {
        console.error(`Error handling interaction: ${error}`);
    }
}

