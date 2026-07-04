import { StringSelectMenuInteraction as DiscordStringSelectMenuInteraction } from "discord.js";
import { User } from "../../../interfaces/domain/User";
import { ServersModel } from "../../../interfaces/database/TableInterfaces";
import { SelectMenuInteractionEvent } from "../../../interfaces/application/Event";
import { AppEntitlement } from "../../../interfaces/application/Entitlement";
import { EventTypeEnum } from "../../../interfaces/enums";
import { BaseReplyDiscordEvent } from "./BaseReplyDiscordEvent";
import DiscordMessageHandler from "../handlers/DiscordMessageHandler";

export class SelectMenuDiscordEvent extends BaseReplyDiscordEvent<DiscordStringSelectMenuInteraction> implements SelectMenuInteractionEvent {
    public readonly type: EventTypeEnum.SELECT_MENU = EventTypeEnum.SELECT_MENU;
    public readonly selected: string;
    public readonly selectedValues: string[];

    constructor(
        interaction: DiscordStringSelectMenuInteraction,
        user: User,
        server: ServersModel,
        channelId: string,
        guildId: string,
        messageId: string,
        customId: string,
        selectedValues: string[],
        entitlements: readonly AppEntitlement[] = []
    ) {
        super(EventTypeEnum.SELECT_MENU, customId, interaction, user, server, channelId, guildId, messageId, entitlements);
        this.selectedValues = selectedValues;
        this.selected = selectedValues[0];
    }

    public async deferReplyAsync(): Promise<void> {
        await DiscordMessageHandler.deferUpdateAsync(this.currentInteraction);
    }

    public async sendAsync(): Promise<void> {
        await DiscordMessageHandler.sendAsync(this, undefined);
        this.flushPostSend();
    }
} 