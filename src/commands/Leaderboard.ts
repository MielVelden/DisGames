import { Command, CommandOptionConfig, CommandOptionType } from "../interfaces/application/Command";
import { SlashCommandInteractionEvent } from "../interfaces/application/Event";
import { i18n } from "../utils/i18n/i18n";
import { MultiLingualString } from "../utils/i18n/MultiLingualString";
import { CommandEnum } from "../interfaces/enums/commands/CommandEnum";
import { LeaderboardCommandActionEnum } from "../interfaces/enums/commands/Leaderboard";
import { createLeaderboardContainerAsync, mapServerEntries, mapUserEntries } from "../builders/containers/LeaderboardContainer";
import ComponentService from "../services/application/ComponentService";
import DiscordComponentMapper from "../services/discord/mappers/DiscordComponentMapper";
import ServerService from "../services/domain/ServerService";
import UserService from "../services/domain/UserService";
import { ServersSaveModel } from "../interfaces/database";
import { Permission } from "../interfaces/enums/application/Permission";

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
                        const channel = await event.currentInteraction.guild?.channels.fetch(existing.channelId).catch(() => null);
                        if (channel?.isTextBased())
                            await channel.messages.fetch(existing.messageId).then(message => message.delete()).catch(() => {});

                        await ServerService.saveAsync(new ServersSaveModel({
                            Id: event.server.Id,
                            SettingsJSON: { ...event.server.Settings, leaderboardLive: undefined }
                        }), event);

                        await event.addComponentAsync(ComponentService.createContent(new MultiLingualString(i18n.commands.leaderboard.labels.liveDisabled)));
                        await event.replyAsync(undefined, true);
                        return;
                    }

                    const entries = mapUserEntries(await UserService.getTopUsersByExperienceAsync(5))
                    const components = await createLeaderboardContainerAsync(entries, event.server.LanguageEnum);

                    const channel = await event.currentInteraction.guild?.channels.fetch(event.channelId);
                    if (!channel || !channel.isTextBased())
                        return;

                    const content = await DiscordComponentMapper.buildMessageContentAsync(event, components);
                    if (!content)
                        return;

                    const sentMessage = await channel.send(content);

                    await ServerService.saveAsync(new ServersSaveModel({
                        Id: event.server.Id,
                        SettingsJSON: { ...event.server.Settings, leaderboardLive: { channelId: event.channelId, messageId: sentMessage.id } }
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
