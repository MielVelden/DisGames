import {
    Client,
    Events,
    Message,
} from 'discord.js';
import { EventTypeEnum as EventTypeEnum } from '../interfaces/application/Event';
import { handleMessageCreateAsync } from './messageCreate';
import { EventService } from '../services/EventService';
import Logger from '../utils/Logger';

export default {
    name: Events.MessageDelete,

    async execute(message: Message, client: Client): Promise<void> {
        // Check if this message was deleted internally
        if (EventService.isMessageInternallyDeleted(message.id)) {
            Logger.logDebug(`Skipping internally deleted message: ${message.id}`);
            EventService.removeInternallyDeletedMessage(message.id);
            return;
        }

        Logger.logDebug(`Message deleted: ${message.content}`);
        await handleMessageCreateAsync(message, EventTypeEnum.MESSAGE_DELETE);
    },
};