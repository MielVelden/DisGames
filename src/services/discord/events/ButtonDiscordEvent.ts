import { ButtonInteraction as DiscordButtonInteraction } from "discord.js";
import { User } from "../../../interfaces/domain/User";
import { ServersModel } from "../../../interfaces/database/TableInterfaces";
import { ButtonInteractionEvent } from "../../../interfaces/application/Event";
import { EventTypeEnum } from "../../../interfaces/enums";
import { BaseReplyDiscordEvent } from "./BaseReplyDiscordEvent";
import DiscordMessageHandler from "../handlers/DiscordMessageHandler";

export class ButtonDiscordEvent extends BaseReplyDiscordEvent implements ButtonInteractionEvent {
    public override get currentInteraction(): DiscordButtonInteraction {
        return super.currentInteraction as DiscordButtonInteraction;
    }

    constructor(
        interaction: DiscordButtonInteraction,
        user: User,
        server: ServersModel,
        channelId: string,
        guildId: string,
        messageId: string,
        customId: string
    ) {
        super(EventTypeEnum.BUTTON, customId, interaction, user, server, channelId, guildId, messageId);
    }

    public async sendAsync(): Promise<void> {
        await DiscordMessageHandler.sendAsync(this, undefined);
    }

    public async reactAsync(emoji: string): Promise<void> {
        await DiscordMessageHandler.reactAsync(this.currentInteraction, emoji);
    }

    public async deleteAsync(): Promise<void> {
        await DiscordMessageHandler.deleteAsync(this);
    }
} 