import { ButtonInteraction as DiscordButtonInteraction } from "discord.js";
import { User } from "../../../interfaces/domain/User";
import { ServersModel } from "../../../interfaces/database/TableInterfaces";
import { ButtonInteractionEvent } from "../../../interfaces/application/Event";
import { AppEntitlement } from "../../../interfaces/application/Entitlement";
import { EventTypeEnum } from "../../../interfaces/enums";
import { BaseReplyDiscordEvent } from "./BaseReplyDiscordEvent";
import DiscordMessageHandler from "../handlers/DiscordMessageHandler";

export class ButtonDiscordEvent extends BaseReplyDiscordEvent<DiscordButtonInteraction> implements ButtonInteractionEvent {
    public readonly type: EventTypeEnum.BUTTON = EventTypeEnum.BUTTON;
    
    constructor(
        interaction: DiscordButtonInteraction,
        user: User,
        server: ServersModel,
        channelId: string,
        guildId: string,
        messageId: string,
        customId: string,
        entitlements: readonly AppEntitlement[] = []
    ) {
        super(EventTypeEnum.BUTTON, customId, interaction, user, server, channelId, guildId, messageId, entitlements);
    }

    public async sendAsync(): Promise<void> {
        await DiscordMessageHandler.sendAsync(this, undefined);
        this.flushPostSend();
    }

    public async reactAsync(emoji: string): Promise<void> {
        await DiscordMessageHandler.reactAsync(this.currentInteraction, emoji);
    }

    public async deleteAsync(): Promise<void> {
        await DiscordMessageHandler.deleteAsync(this);
    }
} 