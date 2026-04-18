import {
    Events,
    Message,
} from 'discord.js';
import { EventTypeEnum } from '../interfaces/enums';
import { handleDiscordMessageAsync } from './messageCreate';
import { InteractionService } from '../services/application/InteractionService';
import Logger from '../utils/application/Logger';

export default {
    name: Events.MessageDelete,

    async execute(message: Message): Promise<void> {
        // Check if this message was deleted internally
        if (InteractionService.isMessageInternallyDeleted(message.id)) {
            Logger.logDebug(`Skipping internally deleted message: ${message.id}`);
            InteractionService.removeInternallyDeletedMessage(message.id);
            return;
        }

        Logger.logDebug(`Message deleted: ${message.content}`);
        await handleDiscordMessageAsync(message, EventTypeEnum.MESSAGE_DELETE);
    },
};