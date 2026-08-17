import { DiscordAPIError, RESTJSONErrorCodes } from "discord.js";
import { JobModule } from "../interfaces/application/Job";
import { discordClient } from "..";
import { BaseInteractionEvent } from "../interfaces/application/Event";
import { createLeaderboardContainerAsync, mapUserEntries } from "../builders/containers/LeaderboardContainer";
import DiscordComponentMapper from "../services/discord/mappers/DiscordComponentMapper";
import ServerService from "../services/domain/ServerService";
import UserService from "../services/domain/UserService";
import Logger from "../utils/application/Logger";

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

            if (live) {
                try {
                    const channel = await discordClient.channels.fetch(live.channelId).catch(() => null);
                    if (channel?.isTextBased()) {
                        const message = await channel.messages.fetch(live.messageId).catch(() => null);

                        if (message) {
                            const entries = mapUserEntries(await UserService.getTopUsersByExperienceAsync(5));
                            const components = await createLeaderboardContainerAsync(entries, server.LanguageEnum);

                            const content = await DiscordComponentMapper.buildMessageContentAsync({ server } as BaseInteractionEvent, components);
                            if (content)
                                await message.edit(content);
                        }
                    }
                } catch (error) {
                    if (error instanceof DiscordAPIError && error.code === RESTJSONErrorCodes.CannotEditMessageAuthoredByAnotherUser) {
                        await ServerService.clearLeaderboardLiveAsync(server);
                        await Logger.logWarning(`Disabled live leaderboard for server ${server.ServerId}: stored message is no longer editable`);
                    } else {
                        await Logger.logError(`Failed to refresh live leaderboard for server ${server.ServerId}`, error as Error);
                    }
                }
            }

            progress(i + 1, servers.length);
        }
    }
} as JobModule;
