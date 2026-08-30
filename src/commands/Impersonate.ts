import { CommandEnum } from "../interfaces/enums/commands/CommandEnum";
import { InteractionEvent, MessageInteractionEvent } from "../interfaces/application/Event";
import { Command, CommandOptionConfig } from "../interfaces/application/Command";
import { MultiLingualString } from "../utils/i18n/MultiLingualString";
import { i18n } from "../utils/i18n/i18n";
import DiscordService from "../services/discord/DiscordService";
import { getConfigValue } from "../utils/application/Config";
import { EnvConfigEnum } from "../interfaces/enums/application/EnvConfigEnum";

const optionsConfig = [] satisfies CommandOptionConfig<string | number>[];

export class ImpersonateCommand implements Command {
    name = CommandEnum.IMPERSONATE;
    description = new MultiLingualString(i18n.commands.impersonate.description);
    isSlashCommand = false;
    isMessageCommand = true;
    options = optionsConfig;
    canExecute = (event: InteractionEvent): boolean => {
        return event.user.userId === getConfigValue(EnvConfigEnum.DISCORD_OWNER_ID);
    }

    async executeAsync(event: MessageInteractionEvent): Promise<void> {
        const regex = /^impersonate\s+(\d+)\s+(?:"([^"]+)"|(.+))$/s;
        const match = event.content.match(regex);

        if (!match)
            return;

        const [, userId, quotedText, unquotedText] = match;
        const messageText = quotedText || unquotedText;

        await DiscordService.impersonateMessageAsync(event, userId, messageText);
    }
}

export default new ImpersonateCommand();