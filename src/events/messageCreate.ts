import {
    Client,
    Events,
    Message,
} from 'discord.js';
import DiscordService from '../services/discord/DiscordService';
import { InteractionEvent, isMessageInteractionEvent } from '../interfaces/application/Event';
import GameService from '../services/domain/GameService';
import { handleErrorAsync } from '../utils/application/Error';
import { handleCommandAsync } from '../utils/handlers/CommandHandler';
import EventsService from '../services/domain/EventsService';
import { EventTypeEnum, isMessageEventType } from '../interfaces/enums';
import { EventsSaveModel } from '../interfaces/database';

export default {
    name: Events.MessageCreate,

    async execute(message: Message, client: Client): Promise<void> {
        await handleDiscordMessageAsync(message, EventTypeEnum.MESSAGE);
    },
};

export async function processMessageEventAsync(event: InteractionEvent): Promise<void> {
    if (!isMessageInteractionEvent(event))
        return;
    await EventsService.saveAsync(new EventsSaveModel({
        UserId: event.user.id,
        ServerId: event.server.Id,
        EventTypeEnum: event.type,
        PayloadJSON: {
            messageId: event.messageId,
            channelId: event.channelId,
            guildId: event.guildId,
            content: event.content
        }
    }), event);

    try {
        if (event.command && (event.command.canExecute?.(event) ?? true))
            await handleCommandAsync(event.command, event);
        else
            await GameService.handleGameAsync(event);
    }
    catch (error) {
        await handleErrorAsync(error, event);
    }
}

export async function handleDiscordMessageAsync(message: Message, eventType: EventTypeEnum): Promise<void> {
    if (message.author.bot)
        return;
    
    if (!isMessageEventType(eventType))
        return;
    
    const event = await DiscordService.mapMessageToInteractionEventAsync(message, eventType);
    await processMessageEventAsync(event);
}