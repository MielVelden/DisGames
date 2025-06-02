import {
    Client,
    Events,
    Message,
} from 'discord.js';
import { EventTypeEnum as EventTypeEnum } from '../interfaces/application/Event';
import { handleMessageCreateAsync } from './messageCreate';

export default {
    name: Events.MessageUpdate,

    async execute(message: Message, client: Client): Promise<void> {
        await handleMessageCreateAsync(message, EventTypeEnum.MESSAGE_UPDATE);
    },
};