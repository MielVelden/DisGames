import { Command, CommandOptionConfig, CommandOptionType } from "../interfaces/application/Command";
import { SlashCommandInteractionEvent } from "../interfaces/application/Event";
import { i18n } from "../utils/i18n/i18n";
import { MultiLingualString } from "../utils/i18n/MultiLingualString";
import { CommandEnum } from "../interfaces/enums/commands/CommandEnum";
import { LeaderboardCommandActionEnum } from "../interfaces/enums/commands/Leaderboard";
import { createLeaderboardContainerAsync, mapServerEntries, mapUserEntries } from "../builders/containers/LeaderboardContainer";
import ComponentService from "../services/application/ComponentService";
import ServerService from "../services/domain/ServerService";
import UserService from "../services/domain/UserService";
import { ServersSaveModel } from "../interfaces/database";
import { Permission } from "../interfaces/enums/application/Permission";
import { isPremiumEnabled, isServerPremium } from "../utils/application/PremiumAccess";
import { ErrorHelper } from "../utils/application/Error";
import { ExceptionEnum } from "../interfaces/enums/application/ExpectionEnum";

const optionsConfig = [
    {
        key: i18n.commands.leaderboard.option,
        type: CommandOptionType.STRING,
        required: true,
        choices: [
            {
                enumValue: LeaderboardCommandActionEnum.SERVERS,
                handler: async (event: SlashCommandInteractionEvent) => {
                    const rows = await ServerService.getTopServersByPointsAsync(5);
                    const components = await createLeaderboardContainerAsync(mapServerEntries(rows), event.server.LanguageEnum);
                    await event.addComponentsAsync(components);
                    await event.replyAsync();
                }
            },
            {
                enumValue: LeaderboardCommandActionEnum.USERS,
                handler: async (event: SlashCommandInteractionEvent) => {
                    const rows = await UserService.getTopUsersByExperienceAsync(5);
                    const components = await createLeaderboardContainerAsync(mapUserEntries(rows), event.server.LanguageEnum);
                    await event.addComponentsAsync(components);
                    await event.replyAsync();
                }
            },
            {
                enumValue: LeaderboardCommandActionEnum.LIVE,
                permissions: [Permission.ADMINISTRATOR],
                handler: async (event: SlashCommandInteractionEvent) => {
                    const existing = event.server.Settings.leaderboardLive;

                    if (existing) {
                        await event.deleteChannelMessageAsync(existing.channelId, existing.messageId);

                        await ServerService.saveAsync(new ServersSaveModel({
                            Id: event.server.Id,
                            SettingsJSON: { ...event.server.Settings, leaderboardLive: undefined }
                        }), event);

                        await event.addComponentAsync(ComponentService.createContent(new MultiLingualString(i18n.commands.leaderboard.labels.liveDisabled)));
                        await event.replyAsync(undefined, true);
                        return;
                    }

                    if (!isServerPremium(event.server) && isPremiumEnabled())
                        ErrorHelper.throw(ExceptionEnum.PREMIUM_ONLY_LIVE_LEADERBOARD);

                    const entries = mapUserEntries(await UserService.getTopUsersByExperienceAsync(5))
                    const components = await createLeaderboardContainerAsync(entries, event.server.LanguageEnum);

                    const messageHandle = await event.sendToChannelAsync(event.channelId, components);
                    if (!messageHandle)
                        return;

                    await ServerService.saveAsync(new ServersSaveModel({
                        Id: event.server.Id,
                        SettingsJSON: { ...event.server.Settings, leaderboardLive: { channelId: messageHandle.channelId, messageId: messageHandle.messageId } }
                    }), event);

                    await event.addComponentAsync(ComponentService.createContent(new MultiLingualString(i18n.commands.leaderboard.labels.liveEnabled)));
                    await event.replyAsync(undefined, true);
                }
            },
        ],
    },
] as CommandOptionConfig<string | number>[];

export class LeaderboardCommand implements Command {
    name = CommandEnum.LEADERBOARD;
    description = new MultiLingualString(i18n.commands.leaderboard.description);
    isSlashCommand = true;
    isMessageCommand = false;
    options = optionsConfig;

    async executeAsync(event: SlashCommandInteractionEvent): Promise<void> {
        await event.handleCommandOptionsAsync();
    }
}

export default new LeaderboardCommand();
