import { Command, CommandOptionConfig, CommandOptionType } from "../interfaces/application/Command";
import { SlashCommandInteractionEvent } from "../interfaces/application/Event";
import { i18n } from "../utils/i18n/i18n";
import { MultiLingualString } from "../utils/i18n/MultiLingualString";
import { CommandEnum } from "../interfaces/enums/commands/CommandEnum";
import { LeaderboardCommandActionEnum } from "../interfaces/enums/commands/Leaderboard";
import { createLeaderboardContainerAsync, mapServerEntries, mapUserEntries } from "../builders/containers/LeaderboardContainer";
import ServerService from "../services/domain/ServerService";
import UserService from "../services/domain/UserService";

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
