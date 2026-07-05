import { ModalSubmitInteraction as DiscordModalSubmitInteraction } from "discord.js";
import { User } from "../../../interfaces/domain/User";
import { ServersModel } from "../../../interfaces/database/TableInterfaces";
import { ModalSubmitInteractionEvent } from "../../../interfaces/application/Event";
import { EventTypeEnum } from "../../../interfaces/enums";
import { BaseReplyDiscordEvent } from "./BaseReplyDiscordEvent";
import DiscordMessageHandler from "../handlers/DiscordMessageHandler";

export class ModalSubmitDiscordEvent extends BaseReplyDiscordEvent<DiscordModalSubmitInteraction> implements ModalSubmitInteractionEvent {
    public readonly type: EventTypeEnum.MODAL_SUBMIT = EventTypeEnum.MODAL_SUBMIT;

    constructor(
        interaction: DiscordModalSubmitInteraction,
        user: User,
        server: ServersModel,
        channelId: string,
        guildId: string,
        messageId: string,
        customId: string
    ) {
        super(EventTypeEnum.MODAL_SUBMIT, customId, interaction, user, server, channelId, guildId, messageId);
    }

    public getValue(key: string): string {
        return this.currentInteraction.fields.getTextInputValue(key);
    }

    public getSelectValues(key: string): string[] {
        return [...this.currentInteraction.fields.getStringSelectValues(key)];
    }

    public getRadioValue(key: string): string | null {
        return this.currentInteraction.fields.getRadioGroup(key) ?? null;
    }

    public getCheckboxValue(key: string): boolean {
        return this.currentInteraction.fields.getCheckbox(key);
    }

    public getCheckboxGroupValues(key: string): string[] {
        return [...this.currentInteraction.fields.getCheckboxGroup(key)];
    }

    public async deferReplyAsync(): Promise<void> {
        await DiscordMessageHandler.deferModalSubmitAsync(this.currentInteraction);
    }

    public async sendAsync(): Promise<void> {
        await DiscordMessageHandler.sendAsync(this, undefined);
        this.flushPostSend();
    }
}
