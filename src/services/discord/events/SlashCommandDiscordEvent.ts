import { Interaction as DiscordInteraction } from "discord.js";
import { User } from "../../../interfaces/domain/User";
import { ServersModel } from "../../../interfaces/database/TableInterfaces";
import { EventTypeEnum, SlashCommandInteractionEvent } from "../../../interfaces/application/Event";
import { Command } from "../../../interfaces/application/Command";
import { BaseReplyDiscordEvent } from "./BaseReplyDiscordEvent";

export class SlashCommandDiscordEvent extends BaseReplyDiscordEvent implements SlashCommandInteractionEvent {
    public readonly command: Command;
    public readonly followUpOptions: Record<string, string | number | boolean> = {};

    constructor(
        interaction: DiscordInteraction,
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
        const discordService = require("../DiscordService").default;
        return discordService.getOption(this.currentInteraction, name);
    }

    public async handleCommandOptionsAsync(): Promise<void> {
        const { handleCommandOptions } = require("../../../utils/Commands");
        await handleCommandOptions(this);
    }

    public getFollowUpOption(key: string): string | number | boolean | undefined {
        return this.followUpOptions[key];
    }

    public setFollowUpOption(key: string, value: string | number | boolean): void {
        this.followUpOptions[key] = value;
    }
} 