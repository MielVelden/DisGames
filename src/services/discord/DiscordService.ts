import {
    Interaction as DiscordInteraction,
    ChatInputCommandInteraction as DiscordChatInputCommandInteraction,
    ButtonInteraction as DiscordButtonInteraction,
    MessageComponentInteraction as DiscordMessageComponentInteraction,
    StringSelectMenuBuilder as DiscordStringSelectMenuBuilder,
    UserSelectMenuBuilder as DiscordUserSelectMenuBuilder,
    RoleSelectMenuBuilder as DiscordRoleSelectMenuBuilder,
    MentionableSelectMenuBuilder as DiscordMentionableSelectMenuBuilder,
    ChannelSelectMenuBuilder as DiscordChannelSelectMenuBuilder,
    ButtonBuilder as DiscordButtonBuilder,
    ActionRowBuilder as DiscordActionRowBuilder,
    Message as DiscordMessage,
    TextDisplayBuilder as DiscordTextDisplayBuilder,
    MediaGalleryBuilder as DiscordMediaGalleryBuilder,
    ContainerBuilder as DiscordContainerBuilder,
} from 'discord.js';
import { SeparatorBuilder as DiscordSeparatorBuilder } from '@discordjs/builders';
import { SlashCommandBuilder } from '@discordjs/builders';
import { EventTypeEnum, InteractionEvent, MessageInteractionEvent } from '../../interfaces/application/Event';
import { Command } from '../../interfaces/application/Command';
import { Component, ComponentType, SelectMenu } from '../../interfaces/application/Message';
import { MultiLingualString } from '../../utils/i18n/MultiLangualString';

// Mappers
import DiscordCommandMapper from './mappers/DiscordCommandMapper';
import DiscordComponentMapper from './mappers/DiscordComponentMapper';
import DiscordInteractionMapper from './mappers/DiscordInteractionMapper';
import DiscordMessageHandler from './handlers/DiscordMessageHandler';

export type DiscordMessageInteraction = DiscordButtonInteraction | DiscordMessageComponentInteraction;
export type DiscordSelectMenuBuilder = DiscordStringSelectMenuBuilder | DiscordUserSelectMenuBuilder | DiscordRoleSelectMenuBuilder | DiscordMentionableSelectMenuBuilder | DiscordChannelSelectMenuBuilder;
export type DiscordComponentBuilder = DiscordButtonBuilder | DiscordSelectMenuBuilder | DiscordTextDisplayBuilder | DiscordMediaGalleryBuilder | DiscordContainerBuilder | DiscordSeparatorBuilder;
export type DiscordActionRowComponent = DiscordSelectMenuBuilder | DiscordButtonBuilder;

export interface DiscordMessageContent {
    components: DiscordActionRowBuilder<any>[];
    files?: any[];
    flags?: any;
}

class DiscordService {
    // #region Mappers - Delegation to dedicated mappers
    
    // Command Mapping
    public mapCommandToSlashCommandBuilder(command: Command): SlashCommandBuilder {
        return DiscordCommandMapper.mapCommandToSlashCommandBuilder(command);
    }

    // Component Mapping
    public async mapComponentToDiscordComponentAsync(component: Component): Promise<DiscordComponentBuilder> {
        return await DiscordComponentMapper.mapComponentToDiscordComponentAsync(component);
    }

    public async buildMessageContentAsync(event: InteractionEvent, components: Component[], message?: MultiLingualString | string): Promise<DiscordMessageContent | null> {
        return await DiscordComponentMapper.buildMessageContentAsync(event, components, message);
    }

    // Interaction Mapping
    public async mapInteractionToInteractionEventAsync(interaction: DiscordInteraction): Promise<InteractionEvent> {
        return await DiscordInteractionMapper.mapInteractionToInteractionEventAsync(interaction);
    }

    public async mapMessageToInteractionEventAsync(message: DiscordMessage, eventType: EventTypeEnum): Promise<InteractionEvent> {
        return await DiscordInteractionMapper.mapMessageToInteractionEventAsync(message, eventType);
    }

    // #endregion

    // #region Message Handling - Delegation to message handler
    
    public async replyAsync(event: InteractionEvent, message?: MultiLingualString): Promise<void> {
        return await DiscordMessageHandler.replyAsync(event, message);
    }

    public async sendAsync(event: InteractionEvent, message?: MultiLingualString): Promise<void> {
        return await DiscordMessageHandler.sendAsync(event, message);
    }

    public async editAsync(event: InteractionEvent, message: MultiLingualString | string): Promise<void> {
        return await DiscordMessageHandler.editAsync(event, message);
    }

    public async editWithComponentAsync(event: InteractionEvent, component: Component): Promise<void> {
        return await DiscordMessageHandler.editWithComponentAsync(event, component);
    }

    public async deleteAsync(event: InteractionEvent): Promise<void> {
        return await DiscordMessageHandler.deleteAsync(event as MessageInteractionEvent);
    }

    public async getUserInputBySelectMenuAsync(event: InteractionEvent, selectMenu: SelectMenu): Promise<InteractionEvent | null> {
        return await DiscordMessageHandler.getUserInputBySelectMenuAsync(event, selectMenu);
    }

    public async getUserInputByButtonsAsync(event: InteractionEvent, question: MultiLingualString, buttons: MultiLingualString[]): Promise<string | null> {
        return await DiscordMessageHandler.getUserInputByButtonsAsync(event, question, buttons);
    }

    // #endregion

    // #region Component Management - Delegation to component mapper

    public async addComponentAsync(event: InteractionEvent, component: Component): Promise<void> {
        return await DiscordComponentMapper.addComponentAsync(event, component);
    }

    public async addComponentsAsync(event: InteractionEvent, components: Component[]): Promise<void> {
        return await DiscordComponentMapper.addComponentsAsync(event, components);
    }

    public async clearComponentsAsync(event: InteractionEvent): Promise<void> {
        return await DiscordComponentMapper.clearComponentsAsync(event);
    }

    // #endregion

    // #region Utility Methods - Keep in main service as they're simple
    
    public getOption(interaction: DiscordChatInputCommandInteraction, name: string): string | number | boolean | undefined {
        const option = interaction.options.get(name);
        return option?.value;
    }

    // #endregion
}

export default new DiscordService();