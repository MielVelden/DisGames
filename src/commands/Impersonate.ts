import { CommandEnum } from "../interfaces/enums/commands/CommandEnum";
import { InteractionEvent, MessageInteractionEvent } from "../interfaces/application/Event";
import { Command } from "../interfaces/application/Command";
import { handleDiscordMessageAsync } from "../events/messageCreate";
import { EventTypeEnum } from "../interfaces/enums";
import { Message as DiscordMessage } from "discord.js";
import { MultiLingualString } from "../utils/i18n/MultiLingualString";
import { i18n } from "../utils/i18n/i18n";
import DiscordMemberService from "../services/discord/DiscordMemberService";
import { getConfigValue } from "../utils/application/Config";
import { EnvConfigEnum } from "../interfaces/enums/application/EnvConfigEnum";

export class ImpersonateCommand implements Command {
    name = CommandEnum.IMPERSONATE;
    description = new MultiLingualString(i18n.commands.impersonate.description);
    isSlashCommand = false;
    isMessageCommand = true;
    options = [];
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

        const guild = event.currentInteraction.guild;
        if (!guild)
            return;

        const targetMember = await DiscordMemberService.fetchMemberAsync(guild, userId);
        if (!targetMember)
            return;

        const originalMessage = event.currentInteraction as DiscordMessage;

        const fakeMessage = new Proxy(originalMessage, {
            get(target, prop) {
                if (prop === 'author') 
                    return targetMember.user;

                if (prop === 'member') 
                    return targetMember;

                if (prop === 'content') 
                    return messageText;

                if (prop === 'guild') 
                    return guild;

                return target[prop as keyof DiscordMessage];
            }
        }) as DiscordMessage;

        await handleDiscordMessageAsync(fakeMessage, EventTypeEnum.MESSAGE);
    }
}

export default new ImpersonateCommand();