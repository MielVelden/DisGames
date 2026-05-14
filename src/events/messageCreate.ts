import {
    Events,
    Message,
} from 'discord.js';
import DiscordService from '../services/discord/DiscordService';
import { InteractionEvent, isMessageInteractionEvent } from '../interfaces/application/Event';
import GameService from '../services/domain/GameService';
import { handleErrorAsync } from '../utils/application/Error';
import { handleCommandAsync } from '../utils/handlers/CommandHandler';
import EventService from '../services/domain/EventService';
import { EventTypeEnum, isMessageEventType } from '../interfaces/enums';
import { EventsSaveModel } from '../interfaces/database';
import { withEventContextAsync } from '../middleware/EventContext';

export default {
    name: Events.MessageCreate,

    async execute(message: Message): Promise<void> {
        await handleDiscordMessageAsync(message, EventTypeEnum.MESSAGE);
    },
};

export async function processMessageEventAsync(event: InteractionEvent): Promise<void> {
    if (!isMessageInteractionEvent(event))
        return;
    return withEventContextAsync(event, async () => {
        try {
            if (event.command && (event.command.canExecute?.(event) ?? true)) {
                await EventService.saveAsync(new EventsSaveModel({
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

                await handleCommandAsync(event.command, event);
            } else {
                if (await GameService.checkActiveGameInChannel(event.channelId)) {
                    await EventService.saveAsync(new EventsSaveModel({
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

                    await GameService.handleGameAsync(event);
                }
            }
        }
        catch (error) {
            await handleErrorAsync(error, event);
        }
    });
}

export async function handleDiscordMessageAsync(message: Message, eventType: EventTypeEnum): Promise<void> {
    if (!message.author || message.author.bot)
        return;

    if (!isMessageEventType(eventType))
        return;

    const event = await DiscordService.mapMessageToInteractionEventAsync(message, eventType);
    await processMessageEventAsync(event);
}