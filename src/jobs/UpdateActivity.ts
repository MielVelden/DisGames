import { JobModule } from "../interfaces/application/Job";
import DiscordService from "../services/discord/DiscordService";

export default {
    id: 'update-activity',
    name: 'Update Activity',
    description: 'Update the activity of the bot',
    isEnabled: true,
    cronExpression: '0 */5 * * * *',

    handler: async (progress): Promise<void> => {
        DiscordService.updateBotActivity();
        progress(1, 1, 'Activity updated');
    }
} as JobModule;