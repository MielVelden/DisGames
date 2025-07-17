import { User } from "../../../interfaces/domain/User";
import { Component, BaseSelectMenu } from "../../../interfaces/application/Message";
import { ServersModel } from "../../../interfaces/database/TableInterfaces";
import { Interaction as DiscordInteraction, Message as DiscordMessage } from "discord.js";
import { MultiLingualString } from "../../../utils/i18n/MultiLangualString";
import { EventTypeEnum, InteractionEvent, SelectMenuInteractionEvent } from "../../../interfaces/application/Event";
import DiscordComponentMapper from "../mappers/DiscordComponentMapper";
import DiscordMessageHandler from "../handlers/DiscordMessageHandler";

export abstract class BaseDiscordEvent implements InteractionEvent {
    public readonly type: EventTypeEnum;
    public readonly customId: string;
    public readonly currentInteraction: DiscordInteraction | DiscordMessage;
    public readonly user: User;
    public readonly server: ServersModel;
    public readonly messageId: string;
    public readonly channelId: string;
    public readonly guildId: string;

    public components: Component[] = [];

    constructor(
        type: EventTypeEnum,
        customId: string,
        interaction: DiscordInteraction | DiscordMessage,
        user: User,
        server: ServersModel,
        channelId: string,
        guildId: string,
        messageId: string
    ) {
        this.type = type;
        this.customId = customId;
        this.currentInteraction = interaction;
        this.user = user;
        this.server = server;
        this.channelId = channelId;
        this.guildId = guildId;
        this.messageId = messageId;
    }

    public async addComponentAsync(component: Component): Promise<void> {
        await DiscordComponentMapper.addComponentAsync(this, component);
    }

    public async addComponentsAsync(components: Component[]): Promise<void> {
        await DiscordComponentMapper.addComponentsAsync(this, components);
    }

    public async clearComponentsAsync(): Promise<void> {
        await DiscordComponentMapper.clearComponentsAsync(this);
    }

    public async sendToChannelAsync(channelId: string, components: Component[]): Promise<void> {
        await DiscordMessageHandler.sendToChannelAsync(this, channelId, components);
    }

    public async editAsync(content?: string): Promise<void> {
        await DiscordMessageHandler.editAsync(this, content);
    }

    public async editWithComponentAsync(component: Component): Promise<void> {
        await DiscordMessageHandler.editWithComponentAsync(this, component);
    }

    public async getUserInputBySelectMenuAsync(selectMenu: BaseSelectMenu): Promise<SelectMenuInteractionEvent | null> {
        const result = await DiscordMessageHandler.getUserInputBySelectMenuAsync(this, selectMenu as any);
        return result as SelectMenuInteractionEvent | null;
    }

    public async getUserInputByButtonsAsync(question: MultiLingualString, buttons: MultiLingualString[]): Promise<string | null> {
        return await DiscordMessageHandler.getUserInputByButtonsAsync(this, question, buttons);
    }

    public async getChannelNameAsync(channelId: string): Promise<string> {
        const guild = this.currentInteraction.guild;
        if (!guild)
            throw new Error("Guild not found");

        const channel = await guild.channels.fetch(channelId);
        return channel?.name || channelId;
    }
} 