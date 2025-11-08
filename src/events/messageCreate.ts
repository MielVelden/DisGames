import {
    Client,
    Events,
    Message,
} from 'discord.js';
import DiscordService from '../services/discord/DiscordService';
import { MessageInteractionEvent } from '../interfaces/application/Event';
import GameService from '../services/domain/GameService';
import { ComponentError } from '../utils/application/Error';
import { i18n } from '../utils/i18n/i18n';
import { MultiLingualString } from '../utils/i18n/MultiLingualString';
import ComponentService from '../services/application/ComponentService';
import Logger from '../utils/application/Logger';
import { handleCommandAsync } from '../utils/handlers/CommandHandler';
import EventsService from '../services/domain/EventsService';
import { EventTypeEnum } from '../interfaces/enums';

export default {
    name: Events.MessageCreate,

    async execute(message: Message, client: Client): Promise<void> {
        await handleDiscordMessageAsync(message, EventTypeEnum.MESSAGE);
    },
};

export async function handleDiscordMessageAsync(message: Message, eventType: EventTypeEnum): Promise<void> {
    if (message.author.bot)
        return;

    const event = await DiscordService.mapMessageToInteractionEventAsync(message, eventType) as MessageInteractionEvent;

    // Save the event to the database
    EventsService.saveAsync({
        UserId: event.user.id,
        ServerId: event.server.Id,
        EventTypeEnum: event.type,
        PayloadJSON: {
            messageId: event.messageId,
            channelId: event.channelId,
            guildId: event.guildId,
            content: event.content
        }
    });

    try {
        if (event.command && (event.command.canExecute?.(event) ?? true))
            await handleCommandAsync(event.command, event);
        else
            await GameService.handleGameAsync(event);
    }
    catch (error) {
        if (error instanceof ComponentError) {
            if (error.hasComponents()) {
                const errorMessage = new MultiLingualString(i18n.exceptions[error.errorKey]);
                event.clearComponentsAsync();
                event.addComponentAsync(ComponentService.createContent(errorMessage));
                for (const component of error.components!) {
                    await event.addComponentAsync(component);
                }
            } else if (error.shouldAnnounceError()) {
                const errorMessage = new MultiLingualString(i18n.exceptions[error.errorKey]);
                await event.addComponentAsync(ComponentService.createContent(errorMessage));
            }

            await event.replyAsync();
        }

        Logger.logError(`Error handling message`, error as Error);
    }
}