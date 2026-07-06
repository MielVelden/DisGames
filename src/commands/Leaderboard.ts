import { Command } from "../interfaces/application/Command";
import { SlashCommandInteractionEvent } from "../interfaces/application/Event";
import { i18n } from "../utils/i18n/i18n";
import { MultiLingualString } from "../utils/i18n/MultiLingualString";
import { CommandEnum } from "../interfaces/enums/commands/CommandEnum";
import { createLeaderboardContainerAsync } from "../builders/containers/LeaderboardContainer";
import ServerService from "../services/domain/ServerService";

export class LeaderboardCommand implements Command {
    name = CommandEnum.LEADERBOARD;
    description = new MultiLingualString(i18n.commands.leaderboard.description);
    isSlashCommand = true;
    isMessageCommand = false;

    async executeAsync(event: SlashCommandInteractionEvent): Promise<void> {
        const entries = await ServerService.getTopServersByPointsAsync(5);
        const components = await createLeaderboardContainerAsync(entries, event.server.LanguageEnum);
        await event.addComponentsAsync(components);
        await event.replyAsync();
    }
}

export default new LeaderboardCommand();
