import { Message as DiscordMessage } from "discord.js";
import { User } from "../../../interfaces/domain/User";
import { ServersModel } from "../../../interfaces/database/TableInterfaces";
import { MessageInteractionEvent } from "../../../interfaces/application/Event";
import { EventTypeEnum } from "../../../interfaces/enums";
import { BaseReplyDiscordEvent } from "./BaseReplyDiscordEvent";
import DiscordMessageHandler from "../handlers/DiscordMessageHandler";
import { Command } from "../../../interfaces/application/Command";
import { AppEntitlement } from "../../../interfaces/application/Entitlement";

export class MessageDiscordEvent extends BaseReplyDiscordEvent<DiscordMessage> implements MessageInteractionEvent {
    public readonly type: EventTypeEnum.MESSAGE | EventTypeEnum.MESSAGE_UPDATE | EventTypeEnum.MESSAGE_DELETE;
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
        eventType: EventTypeEnum.MESSAGE | EventTypeEnum.MESSAGE_UPDATE | EventTypeEnum.MESSAGE_DELETE,
        content: string,
        command?: Command,
        entitlements: readonly AppEntitlement[] = []
    ) {
        super(eventType, interaction.id, interaction, user, server, channelId, guildId, messageId, entitlements);
        this.type = eventType;
        this.content = content;
        this.command = command ?? undefined;
    }

    public async sendAsync(): Promise<void> {
        await DiscordMessageHandler.sendAsync(this, undefined);
    }

    public async reactAsync(emoji: string): Promise<void> {
        await DiscordMessageHandler.reactAsync(this.currentInteraction, emoji);
    }

    public async deleteAsync(): Promise<void> {
        await DiscordMessageHandler.deleteAsync(this);
        this.messageDeleted = true;
    }
} 