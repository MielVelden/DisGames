import {
    Interaction,
    Events,
} from 'discord.js';
import DiscordService from '../services/discord/DiscordService';
import { DiscordClient } from '../interfaces/application/DiscordClient';
import { InteractionEvent, isSlashCommandInteractionEvent } from '../interfaces/application/Event';
import { handleCommandAsync } from '../utils/handlers/CommandHandler';
import { EventService } from '../services/application/EventService';
import { handleErrorAsync } from '../utils/application/Error';
import EventsService from '../services/domain/EventsService';
import { EventsSaveModel } from '../interfaces/database';
import { EventTypeEnum } from '../interfaces/enums';
import { withEventContextAsync } from '../middleware/EventContext';

export default {
    name: Events.InteractionCreate,

    async execute(interaction: Interaction, client: DiscordClient): Promise<void> {
        // Map the interaction to the InteractionEvent interface
        const event = await DiscordService.mapInteractionToInteractionEventAsync(interaction);

        await handleDiscordInteractionAsync(event);
    },
};

export async function handleDiscordInteractionAsync(event: InteractionEvent): Promise<void> {
    return withEventContextAsync(event, async () => {
        await EventsService.saveAsync(new EventsSaveModel({
            UserId: event.user.id,
            ServerId: event.server.Id,
            EventTypeEnum: event.type,
            PayloadJSON: {
                messageId: event.messageId,
                channelId: event.channelId,
                guildId: event.guildId,
                commandName: isSlashCommandInteractionEvent(event) ? event.command?.name : undefined
            }
        }), event);

        try {
            if (isSlashCommandInteractionEvent(event) && (event.command.canExecute?.(event) ?? true))
                await handleCommandAsync(event.command, event);
            else
                await EventService.handleEventAsync(event);
        }
        catch (error) {
            await handleErrorAsync(error, event);
        }
    });
}