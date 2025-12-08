import { ChatInputCommandInteraction as DiscordChatInputCommandInteraction } from "discord.js";
import { User } from "../../../interfaces/domain/User";
import { ServersModel } from "../../../interfaces/database/TableInterfaces";
import { SlashCommandInteractionEvent } from "../../../interfaces/application/Event";
import { EventTypeEnum } from "../../../interfaces/enums";
import { Command } from "../../../interfaces/application/Command";
import { BaseReplyDiscordEvent } from "./BaseReplyDiscordEvent";
import { handleCommandOptionsAsync } from "../../../utils/handlers/CommandHandler";
import DiscordService from "../DiscordService";

export class SlashCommandDiscordEvent extends BaseReplyDiscordEvent<DiscordChatInputCommandInteraction> implements SlashCommandInteractionEvent {
    public readonly command: Command;
    public readonly followUpOptions: Record<string, string | number | boolean> = {};

    constructor(
        interaction: DiscordChatInputCommandInteraction,
        user: User,
        server: ServersModel,
        channelId: string,
        guildId: string,
        messageId: string,
        command: Command
    ) {
        super(EventTypeEnum.SLASH_COMMAND, interaction.id, interaction, user, server, channelId, guildId, messageId);
        this.command = command;
    }

    public getOption(name: string): string | number | boolean | undefined;
    public getOption<T>(name: string): T | undefined;
    public getOption<T>(name: string): T | undefined {
        return DiscordService.getOption(this.currentInteraction, name) as T | undefined;
    }

    public async handleCommandOptionsAsync(): Promise<void> {
        await handleCommandOptionsAsync(this);
    }

    public getFollowUpOption(key: string): string | number | boolean | undefined {
        return this.followUpOptions[key];
    }

    public setFollowUpOption(key: string, value: string | number | boolean): void {
        this.followUpOptions[key] = value;
    }
} 