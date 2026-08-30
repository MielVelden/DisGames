import { JobModule } from "../interfaces/application/Job";
import { createLeaderboardContainerAsync, mapUserEntries } from "../builders/containers/LeaderboardContainer";
import DiscordMessageHandler from "../services/discord/handlers/DiscordMessageHandler";
import ServerService from "../services/domain/ServerService";
import UserService from "../services/domain/UserService";
import Logger from "../utils/application/Logger";
import { isPremiumEnabled, isServerPremium } from "../utils/application/PremiumAccess";

export default {
    id: 'refresh-live-leaderboards',
    name: 'Refresh Live Leaderboards',
    description: 'Refreshes every server\'s live leaderboard message',
    isEnabled: true,
    cronExpression: '0 0 0 * * *',

    handler: async (progress): Promise<void> => {
        const servers = await ServerService.getServersWithLeaderboardLiveAsync();

        for (let i = 0; i < servers.length; i++) {
            const server = servers[i];
            const live = server.Settings.leaderboardLive;

            if (live && !isServerPremium(server) && isPremiumEnabled()) {
                await ServerService.clearLeaderboardLiveAsync(server);
                await Logger.logWarning(`Disabled live leaderboard for server ${server.ServerId}: server is no longer Pro`);
            } else if (live) {
                try {
                    const entries = mapUserEntries(await UserService.getTopUsersByExperienceAsync(5));
                    const components = await createLeaderboardContainerAsync(entries, server.LanguageEnum);

                    const result = await DiscordMessageHandler.editGuildChannelMessageAsync(live.channelId, live.messageId, components, server);

                    if (!result.success && result.noLongerEditable) {
                        await ServerService.clearLeaderboardLiveAsync(server);
                        await Logger.logWarning(`Disabled live leaderboard for server ${server.ServerId}: stored message is no longer editable`);
                    }
                } catch (error) {
                    await Logger.logError(`Failed to refresh live leaderboard for server ${server.ServerId}`, error as Error);
                }
            }

            progress(i + 1, servers.length);
        }
    }
} as JobModule;
