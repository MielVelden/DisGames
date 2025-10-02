import { Message as DiscordMessage } from "discord.js";
import { User } from "../../../interfaces/domain/User";
import { ServersModel } from "../../../interfaces/database/TableInterfaces";
import { MessageInteractionEvent } from "../../../interfaces/application/Event";
import { EventTypeEnum } from "../../../interfaces/enums";
import { BaseReplyDiscordEvent } from "./BaseReplyDiscordEvent";
import DiscordMessageHandler from "../handlers/DiscordMessageHandler";
import { Command } from "../../../interfaces/application/Command";

export class MessageDiscordEvent extends BaseReplyDiscordEvent implements MessageInteractionEvent {
    public messageDeleted: boolean = false;
    public readonly content: string;
    public readonly command?: Command;
    
    constructor(
        interaction: DiscordMessage,
        user: User,
        server: ServersModel,
        channelId: string,
        guildId: string,
        messageId: string,
        eventType: EventTypeEnum,
        content: string,
        command?: Command
    ) {
        super(eventType, interaction.id, interaction, user, server, channelId, guildId, messageId);
        this.content = content;
        this.command = command ?? undefined;
    }

    public async sendAsync(): Promise<void> {
        await DiscordMessageHandler.sendAsync(this, undefined);
    }

    public async reactAsync(emoji: string): Promise<void> {
        await DiscordMessageHandler.reactAsync(this.currentInteraction as DiscordMessage, emoji);
    }

    public async deleteAsync(): Promise<void> {
        await DiscordMessageHandler.deleteAsync(this);
        this.messageDeleted = true;
    }
} 