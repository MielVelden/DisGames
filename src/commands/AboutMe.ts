import { Command } from "../interfaces/application/Command";
import { SlashCommandInteractionEvent } from "../interfaces/application/Event";
import { i18n } from "../utils/i18n/i18n";
import { MultiLingualString } from "../utils/i18n/MultiLingualString";
import { CommandEnum } from "../interfaces/enums/commands/CommandEnum";
import { createAboutMeContainer } from "../builders/containers/AboutMeContainer";
import packageJson from "../../package.json";
import { EnvConfigEnum } from "../interfaces/enums/application/EnvConfigEnum";
import { getConfigValue } from "../utils/application/Config";

export class AboutMeCommand implements Command {
    name = CommandEnum.ABOUTME;
    description = new MultiLingualString(i18n.commands.aboutme.description);
    isSlashCommand = true;
    isMessageCommand = false;

    async executeAsync(event: SlashCommandInteractionEvent): Promise<void> {
        const version = packageJson.version;
        const githubUrl = packageJson.github;
        const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${getConfigValue(EnvConfigEnum.DISCORD_CLIENT_ID)}&permissions=8&scope=bot%20applications.commands`;
        const components = createAboutMeContainer(inviteUrl, githubUrl, version);
        await event.addComponentsAsync(components);
        await event.replyAsync();
    }
}

export default new AboutMeCommand();
