import { Message as DiscordMessage } from "discord.js";
import { User } from "../../../interfaces/domain/User";
import { ServersModel } from "../../../interfaces/database/TableInterfaces";
import { EventTypeEnum, MessageInteractionEvent } from "../../../interfaces/application/Event";
import { BaseReplyDiscordEvent } from "./BaseReplyDiscordEvent";
import DiscordMessageHandler from "../handlers/DiscordMessageHandler";

export class MessageDiscordEvent extends BaseReplyDiscordEvent implements MessageInteractionEvent {
    public messageDeleted: boolean = false;
    public readonly content: string;

    constructor(
        interaction: DiscordMessage,
        user: User,
        server: ServersModel,
        channelId: string,
        guildId: string,
        messageId: string,
        eventType: EventTypeEnum,
        content: string
    ) {
        super(eventType, interaction.id, interaction, user, server, channelId, guildId, messageId);
        this.content = content;
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