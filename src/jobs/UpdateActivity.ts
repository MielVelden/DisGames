import { JobModule } from "../interfaces/application/Job";
import { discordClient } from "..";
import { ActivityType } from "discord.js";

export default {
    id: 'update-activity',
    name: 'Update Activity',
    description: 'Update the activity of the bot',
    isEnabled: true,
    cronExpression: '0 */5 * * * *',

    handler: async (progress): Promise<void> => {
        discordClient.user?.setActivity({
            name: 'Minigames | /games',
            type: ActivityType.Watching,
            state: `Supporting ${discordClient.guilds.cache.size} servers`,
        })
        progress(1, 1, 'Activity updated');
    }
} as JobModule;