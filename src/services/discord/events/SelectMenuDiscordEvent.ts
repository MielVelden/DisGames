import { StringSelectMenuInteraction as DiscordStringSelectMenuInteraction } from "discord.js";
import { User } from "../../../interfaces/domain/User";
import { ServersModel } from "../../../interfaces/database/TableInterfaces";
import { SelectMenuInteractionEvent } from "../../../interfaces/application/Event";
import { EventTypeEnum } from "../../../interfaces/enums";
import { BaseReplyDiscordEvent } from "./BaseReplyDiscordEvent";
import DiscordMessageHandler from "../handlers/DiscordMessageHandler";

export class SelectMenuDiscordEvent extends BaseReplyDiscordEvent implements SelectMenuInteractionEvent {
    public readonly selected: string;

    public override get currentInteraction(): DiscordStringSelectMenuInteraction {
        return super.currentInteraction as DiscordStringSelectMenuInteraction;
    }

    constructor(
        interaction: DiscordStringSelectMenuInteraction,
        user: User,
        server: ServersModel,
        channelId: string,
        guildId: string,
        messageId: string,
        customId: string,
        selected: string
    ) {
        super(EventTypeEnum.SELECT_MENU, customId, interaction, user, server, channelId, guildId, messageId);
        this.selected = selected;
    }

    public async deferReplyAsync(): Promise<void> {
        await DiscordMessageHandler.deferUpdateAsync(this.currentInteraction);
    }

    public async sendAsync(): Promise<void> {
        await DiscordMessageHandler.sendAsync(this, undefined);
    }
} 