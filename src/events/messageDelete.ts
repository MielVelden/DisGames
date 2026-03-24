import {
    Events,
    Message,
} from 'discord.js';
import { EventTypeEnum } from '../interfaces/enums';
import { handleDiscordMessageAsync } from './messageCreate';
import { EventService } from '../services/application/EventService';
import Logger from '../utils/application/Logger';

export default {
    name: Events.MessageDelete,

    async execute(message: Message): Promise<void> {
        // Check if this message was deleted internally
        if (EventService.isMessageInternallyDeleted(message.id)) {
            Logger.logDebug(`Skipping internally deleted message: ${message.id}`);
            EventService.removeInternallyDeletedMessage(message.id);
            return;
        }

        Logger.logDebug(`Message deleted: ${message.content}`);
        await handleDiscordMessageAsync(message, EventTypeEnum.MESSAGE_DELETE);
    },
};