import {
    Client,
    Events,
    Message,
} from 'discord.js';
import DiscordService from '../services/discord/DiscordService';
import { MessageInteractionEvent, EventTypeEnum } from '../interfaces/application/Event';
import GameService from '../services/GameService';
import { ComponentError } from '../utils/ErrorHelper';
import { i18n } from '../utils/i18n/i18n';
import { MultiLingualString } from '../utils/i18n/MultiLangualString';
import ComponentService from '../services/ComponentService';
import Logger from '../utils/Logger';
import { handleCommand } from '../utils/Commands';

export default {
    name: Events.MessageCreate,

    async execute(message: Message, client: Client): Promise<void> {
        await handleMessageCreateAsync(message, EventTypeEnum.MESSAGE);
    },
};

export async function handleMessageCreateAsync(message: Message, eventType: EventTypeEnum): Promise<void> {
    const event = await DiscordService.mapMessageToInteractionEventAsync(message, eventType) as MessageInteractionEvent;

    try {
        if (message.author.bot)
            return;
        if (event.command)
            await handleCommand(event.command, event);
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
            } else {
                const errorMessage = new MultiLingualString(i18n.exceptions[error.errorKey]);
                await event.addComponentAsync(ComponentService.createContent(errorMessage));
            }
            
            await event.replyAsync();
        }
        
        Logger.logError(`Error handling message`, error as Error);
    }
}

