import {
    Client,
    Events,
    Message,
} from 'discord.js';
import { EventTypeEnum as EventTypeEnum } from '../interfaces/application/Event';
import { handleMessageCreateAsync } from './messageCreate';
import { EventService } from '../services/EventService';

export default {
    name: Events.MessageDelete,

    async execute(message: Message, client: Client): Promise<void> {
        // Check if this message was deleted internally
        if (EventService.isMessageInternallyDeleted(message.id)) {
            console.log(`[INFO] Skipping internally deleted message: ${message.id}`);
            EventService.removeInternallyDeletedMessage(message.id);
            return;
        }

        console.log(`[INFO] Message deleted: ${message.content}`);
        await handleMessageCreateAsync(message, EventTypeEnum.MESSAGE_DELETE);
    },
};