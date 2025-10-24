import {
    Interaction,
    Events,
} from 'discord.js';
import DiscordService from '../services/discord/DiscordService';
import { DiscordClient } from '../interfaces/application/DiscordClient';
import { SlashCommandInteractionEvent } from '../interfaces/application/Event';
import { handleCommand } from '../utils/Commands';
import { EventService } from '../services/application/EventService';
import ComponentService from '../services/application/ComponentService';
import { ComponentError } from '../utils/Error';
import { MultiLingualString } from '../utils/i18n/MultiLingualString';
import { i18n } from '../utils/i18n/i18n';
import Logger from '../utils/Logger';
import EventsService from '../services/domain/EventsService';
import { EventTypeEnum } from '../interfaces/enums';

export default {
    name: Events.InteractionCreate,

    async execute(interaction: Interaction, client: DiscordClient): Promise<void> {
        // Map the interaction to the InteractionEvent interface
        const event = await DiscordService.mapInteractionToInteractionEventAsync(interaction) as SlashCommandInteractionEvent;

        // Save the event to the database
        EventsService.saveAsync({
            UserId: event.user.id,
            ServerId: event.server.Id,
            EventTypeEnum: event.type,
            PayloadJSON: {
                messageId: event.messageId,
                channelId: event.channelId,
                guildId: event.guildId,
                commandName: event.command.name
            }
        });
        
        try {
            if (event.type === EventTypeEnum.SLASH_COMMAND)
                await handleCommand(event.command, event);
            else
                await EventService.handleEventAsync(event);
        }
        catch (error) {
            if (error instanceof ComponentError && error.hasComponents()) {
                const errorKey = error.errorKey;
                const errorMessage = new MultiLingualString(i18n.exceptions[errorKey]);
                if (error.hasComponents()) {
                    event.clearComponentsAsync();
                    event.addComponentAsync(ComponentService.createContent(errorMessage));
                    error.components!.forEach(async (component) => {
                        await event.addComponentAsync(component);
                    });
                } else {
                    await event.addComponentAsync(ComponentService.createContent(errorMessage));
                }
            }

            await event.replyAsync();
            Logger.logError(`Error handling interaction`, error as Error);
        }
    },
};