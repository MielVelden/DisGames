import {
    Interaction,
    Client,
    Collection,
    Events,
    Message,
} from 'discord.js';
import DiscordService from '../services/DiscordService';


export default {
    name: Events.MessageCreate,

    async execute(message: Message, client: Client): Promise<void> {
        try {
            console.log(message);
            // Map the interaction to the InteractionEvent interface
            // const interactionEvent = await DiscordService.mapInteractionToInteractionEventAsync(message);
            // console.log("interactionEvent", interactionEvent);
        }
        catch (error) {
            console.error(`Error handling interaction: ${error}`);
        }
    },
};