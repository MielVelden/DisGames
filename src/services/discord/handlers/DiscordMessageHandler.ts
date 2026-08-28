import {
    Guild as DiscordGuild,
    User as DiscordUser,
    Message as DiscordMessage,
    StringSelectMenuInteraction as DiscordStringSelectMenuInteraction,
    ChannelSelectMenuInteraction as DiscordChannelSelectMenuInteraction,
    ModalSubmitInteraction as DiscordModalSubmitInteraction,
    DiscordAPIError,
    RESTJSONErrorCodes
} from 'discord.js';
import { discordClient } from '../../..';
import { InteractionEvent, ModalSubmitInteractionEvent, RenderContext, isButtonInteractionEvent, isMessageInteractionEvent } from '../../../interfaces/application/Event';
import { ModalDefinition, ModalField, ModalResult } from '../../../interfaces/application/Modal';
import { ActionButton, ButtonStyle, Component, ComponentType, ComponentVisibility, MessageHandle, SelectMenu } from '../../../interfaces/application/Message';
import ComponentService from '../../application/ComponentService';
import { MultiLingualString } from '../../../utils/i18n/MultiLingualString';
import { InteractionService } from '../../application/InteractionService';
import { i18n } from '../../../utils/i18n/i18n';
import DiscordComponentMapper from '../mappers/DiscordComponentMapper';
import DiscordModalMapper from '../mappers/DiscordModalMapper';
import { DiscordMessageContent, DiscordMessageInteraction } from '../DiscordService';
import { createAcceptButton } from '../../../builders/buttons/AcceptButton';
import { createDenyButton } from '../../../builders/buttons/DenyButton';
import { EventTypeEnum, ExceptionEnum } from '../../../interfaces/enums';
import { ServersModel } from '../../../interfaces/database/TableInterfaces';
import { ErrorHelper } from '../../../utils/application/Error';
import Logger from '../../../utils/application/Logger';
import { createTitle } from '../../../utils/helpers/Markdown';

class DiscordMessageHandler {
    public async sendMessageAsync(user: DiscordUser, message: string): Promise<void> {
        await user.send(message);
    }

    public async replyAsync(event: InteractionEvent, message: MultiLingualString | undefined, ephemeral?: boolean): Promise<void> {
        const resolvedEphemeral = ephemeral ?? this.resolveEphemeral(event.components);
        let content: DiscordMessageContent | null;
        try {
            content = await DiscordComponentMapper.buildMessageContentAsync(event, event.components, message, resolvedEphemeral);
        } catch (error) {
            await Logger.logError(`Failed to build reply content for event type ${event.type}`, error as Error);
            throw error;
        }

        if (!content)
            return;

        if (isMessageInteractionEvent(event)) {
            if (event.type === EventTypeEnum.MESSAGE_DELETE) {
                await this.sendAsync(event, message);
                return;
            }
        }

        await this.handleInteractionReplyAsync(event, content);
    }

    public async sendAsync(event: InteractionEvent, message: MultiLingualString | undefined): Promise<void> {
        let content: DiscordMessageContent | null;
        
        try {
            content = await DiscordComponentMapper.buildMessageContentAsync(event, event.components, message);
        } catch (error) {
            await Logger.logError(`Failed to build send content for event type ${event.type}`, error as Error);
            throw error;
        }

        if (!content) 
            return;

        const guild = event.currentInteraction.guild;
        if (!guild)
            throw new Error("Guild not found");

        const channel = await guild.channels.fetch(event.channelId);
        if (!channel || !channel.isTextBased())
            throw new Error("Channel not found or not text-based");

        await channel.send(content);
    }

    public async editWithComponentsAsync(event: InteractionEvent, components: Component[]): Promise<void> {
        event.clearComponentsAsync();
        await event.addComponentsAsync(components);
        await this.editAsync(event);
    }

    public async editAsync(event: InteractionEvent, message?: MultiLingualString | string): Promise<void> {
        let content: DiscordMessageContent | null;
        
        try {
            content = await DiscordComponentMapper.buildMessageContentAsync(event, event.components, message);
        } catch (error) {
            await Logger.logError(`Failed to build edit content for event type ${event.type}`, error as Error);
            throw error;
        }
        
        if (!content)
            return;

        await this.handleInteractionEditAsync(event, content);
    }

    public async deleteAsync(event: InteractionEvent): Promise<void> {
        // Mark message as internally deleted before deleting
        if (isMessageInteractionEvent(event)) {
            if (event.messageDeleted)
                return;

            try {
                await event.currentInteraction.delete();
                event.messageDeleted = true;
                InteractionService.markMessageAsInternallyDeleted(event.currentInteraction.id);
            } catch (error) {
                if (this.isUnknownMessageError(error)) {
                    event.messageDeleted = true;
                    InteractionService.markMessageAsInternallyDeleted(event.currentInteraction.id);
                    await Logger.logWarning(`Message ${event.currentInteraction.id} was already deleted in channel ${event.channelId}`);
                    return;
                }

                if (this.isMissingPermissionsError(error)) {
                    await Logger.logWarning(`Missing permissions while deleting message ${event.currentInteraction.id} in channel ${event.channelId}`);
                    return;
                }

                throw error;
            }
        } else {
            // For button interactions, we can get the message ID
            if (isButtonInteractionEvent(event) && event.currentInteraction.message)
                InteractionService.markMessageAsInternallyDeleted(event.currentInteraction.message.id);

            if (isButtonInteractionEvent(event)) {
                try {
                    await event.currentInteraction.deleteReply();
                } catch (error) {
                    if (this.isUnknownMessageError(error)) {
                        if (event.currentInteraction.message)
                            InteractionService.markMessageAsInternallyDeleted(event.currentInteraction.message.id);
                        await Logger.logWarning(`Reply message was already deleted in channel ${event.channelId}`);
                        return;
                    }

                    if (this.isMissingPermissionsError(error)) {
                        await Logger.logWarning(`Missing permissions while deleting reply in channel ${event.channelId}`);
                        return;
                    }

                    throw error;
                }
            }
        }
    }

    private resolveEphemeral(components: Component[]): boolean {
        const usefulComponents = components.filter(c => c.type !== ComponentType.SEPARATOR);
        return usefulComponents.length > 0 && usefulComponents.every(c => c.visibility === ComponentVisibility.PRIVATE);
    }

    private isMissingPermissionsError(error: unknown): boolean {
        if (!error || typeof error !== 'object')
            return false;

        const discordError = error as { code?: number; status?: number };
        return (discordError.code === 50013 || discordError.code === 50001) && discordError.status === 403;
    }

    private isUnknownMessageError(error: unknown): boolean {
        if (!error || typeof error !== 'object')
            return false;

        const discordError = error as { code?: number; status?: number };
        return discordError.code === 10008 && discordError.status === 404;
    }

    private isUnknownMessageReferenceError(error: unknown): boolean {
        if (!error || typeof error !== 'object')
            return false;

        const discordError = error as {
            code?: number;
            status?: number;
            rawError?: {
                errors?: {
                    message_reference?: {
                        _errors?: Array<{ code?: string }>;
                    };
                };
            };
        };

        const referenceErrors = discordError.rawError?.errors?.message_reference?._errors;
        const hasUnknownReference = !!referenceErrors?.some(referenceError => referenceError.code === 'MESSAGE_REFERENCE_UNKNOWN_MESSAGE');
        return discordError.code === 50035 && discordError.status === 400 && hasUnknownReference;
    }

    private isUnknownInteractionError(error: unknown): boolean {
        if (!error || typeof error !== 'object')
            return false;

        const discordError = error as { code?: number; status?: number };
        return discordError.code === 10062 && discordError.status === 404;
    }

    private isInteractionAlreadyRepliedError(error: unknown): boolean {
        if (!error || typeof error !== 'object')
            return false;

        const discordError = error as { code?: string; name?: string };
        return discordError.code === 'InteractionAlreadyReplied' || discordError.name === 'InteractionAlreadyReplied';
    }

    private isInteractionNotRepliedError(error: unknown): boolean {
        if (!error || typeof error !== 'object')
            return false;

        const discordError = error as { code?: string; name?: string };
        return discordError.code === 'InteractionNotReplied' || discordError.name === 'InteractionNotReplied';
    }

    public async reactAsync(interaction: DiscordMessageInteraction | DiscordMessage, emoji: string): Promise<void> {
        try {
            if (interaction instanceof DiscordMessage)
                await interaction.react(emoji);
            else
                await interaction.message.react(emoji);
        } catch (error) {
            if (this.isMissingPermissionsError(error)) {
                const messageId = interaction instanceof DiscordMessage ? interaction.id : interaction.message.id;
                const channelId = interaction instanceof DiscordMessage ? interaction.channelId : interaction.channelId;
                await Logger.logWarning(`Missing permissions while reacting to message ${messageId} in channel ${channelId}`);
                return;
            }

            throw error;
        }
    }

    public async deferUpdateAsync(interaction: DiscordStringSelectMenuInteraction | DiscordChannelSelectMenuInteraction): Promise<void> {
        await interaction.deferUpdate();
    }

    public async deferModalSubmitAsync(interaction: DiscordModalSubmitInteraction): Promise<void> {
        // When the modal was opened from a message component (button), the submit can update
        // that message; from a slash command there is no message to update, so defer a reply.
        if (interaction.isFromMessage())
            await interaction.deferUpdate();
        else
            await interaction.deferReply({ ephemeral: true });
    }


    public async handleInteractionReplyAsync(event: InteractionEvent, content: DiscordMessageContent): Promise<void> {
        // If the message is deleted, don't reply
        if (isMessageInteractionEvent(event) && event.messageDeleted)
            return;

        switch (event.type) {
            case EventTypeEnum.SLASH_COMMAND:
                if (event.currentInteraction.replied) {
                    await event.currentInteraction.editReply({
                        ...content,
                        content: null
                    });
                } else {
                    try {
                        await event.currentInteraction.reply(content);
                    } catch (error) {
                        if (this.isUnknownInteractionError(error)) {
                            await Logger.logWarning(`Interaction ${event.currentInteraction.id} expired before slash command reply in channel ${event.channelId}`);
                            return;
                        }

                        throw error;
                    }
                }
                break;
            case EventTypeEnum.MESSAGE:
            case EventTypeEnum.MESSAGE_UPDATE:
            case EventTypeEnum.MESSAGE_DELETE:
                if (event.currentInteraction.resolved) {
                    await event.currentInteraction.edit(content);
                } else {
                    try {
                        await event.currentInteraction.reply(content);
                    } catch (error) {
                        if (this.isUnknownMessageReferenceError(error)) {
                            const channel = event.currentInteraction.channel;
                            if (channel && channel.isTextBased() && 'send' in channel) {
                                await Logger.logWarning(`Referenced message ${event.currentInteraction.id} no longer exists in channel ${event.channelId}, sending without reference`);
                                await channel.send(content);
                                return;
                            }
                        }

                        throw error;
                    }
                }
                break;
            case EventTypeEnum.BUTTON:
            case EventTypeEnum.SELECT_MENU:
                try {
                    if(content.ephemeral)
                        await event.currentInteraction.reply(content);
                    else
                        await event.currentInteraction.update(content);
                } catch (error) {
                    if (this.isInteractionAlreadyRepliedError(error)) {
                        if (event.currentInteraction.deferred || event.currentInteraction.replied) {
                            await event.currentInteraction.editReply(content);
                            return;
                        }

                        await event.currentInteraction.followUp(content);
                        return;
                    }

                    throw error;
                }
                break;
            case EventTypeEnum.MODAL_SUBMIT:
                try {
                    if (event.currentInteraction.deferred || event.currentInteraction.replied)
                        await event.currentInteraction.editReply(content);
                    else if (content.ephemeral || !event.currentInteraction.isFromMessage())
                        await event.currentInteraction.reply(content);
                    else
                        await event.currentInteraction.update(content);
                } catch (error) {
                    if (this.isInteractionAlreadyRepliedError(error)) {
                        await event.currentInteraction.followUp(content);
                        return;
                    }

                    throw error;
                }
                break;
            default:
                ErrorHelper.throw(ExceptionEnum.METHOD_NOT_IMPLEMENTED);
        }
    }

    public async handleInteractionEditAsync(event: InteractionEvent, content: DiscordMessageContent): Promise<void> {
        switch (event.type) {
            case EventTypeEnum.SLASH_COMMAND:
                try {
                    await event.currentInteraction.editReply(content);
                } catch (error) {
                    if (this.isUnknownInteractionError(error) || this.isInteractionNotRepliedError(error)) {
                        await Logger.logWarning(`Interaction ${event.currentInteraction.id} expired before edit in channel ${event.channelId}`);
                        return;
                    }

                    throw error;
                }
                break;
            case EventTypeEnum.MESSAGE:
            case EventTypeEnum.MESSAGE_UPDATE:
            case EventTypeEnum.MESSAGE_DELETE:
                await event.currentInteraction.edit(content);
                break;
            case EventTypeEnum.BUTTON:
                try {
                    await event.currentInteraction.update(content);
                } catch (error) {
                    if (this.isInteractionAlreadyRepliedError(error) || this.isUnknownInteractionError(error)) {
                        if (event.currentInteraction.deferred || event.currentInteraction.replied) {
                            await event.currentInteraction.editReply(content);
                            return;
                        }

                        await Logger.logWarning(`Interaction ${event.currentInteraction.id} could not be updated during edit in channel ${event.channelId}`);
                        return;
                    }

                    throw error;
                }
                break;
            case EventTypeEnum.SELECT_MENU:
                if (event.currentInteraction.deferred) {
                    await event.currentInteraction.editReply(content);
                } else {
                    try {
                        await event.currentInteraction.update(content);
                    } catch (error) {
                        if (this.isInteractionAlreadyRepliedError(error) || this.isUnknownInteractionError(error)) {
                            if (event.currentInteraction.deferred || event.currentInteraction.replied) {
                                await event.currentInteraction.editReply(content);
                                return;
                            }

                            await Logger.logWarning(`Interaction ${event.currentInteraction.id} could not be updated during select menu edit in channel ${event.channelId}`);
                            return;
                        }

                        throw error;
                    }
                }
                break;
            case EventTypeEnum.MODAL_SUBMIT:
                // Modal submits are deferred before the handler runs, so an edit maps to editReply.
                if (event.currentInteraction.deferred || event.currentInteraction.replied) {
                    await event.currentInteraction.editReply(content);
                } else {
                    try {
                        if (event.currentInteraction.isFromMessage())
                            await event.currentInteraction.update(content);
                        else
                            await event.currentInteraction.reply(content);
                    } catch (error) {
                        if (this.isInteractionAlreadyRepliedError(error) || this.isUnknownInteractionError(error)) {
                            await Logger.logWarning(`Interaction ${event.currentInteraction.id} could not be updated during modal submit edit in channel ${event.channelId}`);
                            return;
                        }

                        throw error;
                    }
                }
                break;
            default:
                ErrorHelper.throw(ExceptionEnum.METHOD_NOT_IMPLEMENTED);
        }
    }

    private async handleSelectMenuTimeoutAsync(event: InteractionEvent, selectMenu: SelectMenu, resolve: (value: InteractionEvent | null) => void): Promise<void> {
        // Disable the select menu
        selectMenu.disabled = true;

        // Clear the components and add the select menu back to the components
        await event.clearComponentsAsync();
        await event.addComponentAsync(ComponentService.createContent(createTitle(new MultiLingualString(i18n.labels.common.timedOut.title))));
        await event.addComponentAsync(ComponentService.createContent(new MultiLingualString(i18n.labels.common.timedOut.description)));
        await event.addComponentAsync(selectMenu);

        try {
            await this.editAsync(event);
        } catch (error) {
            if (!this.isUnknownMessageError(error))
                throw error;

            const discordContent = await DiscordComponentMapper.buildMessageContentAsync(event, event.components);
            if (!discordContent)
                return resolve(null);

            if (discordContent.ephemeral)
                return resolve(null);

            const channel = (event.currentInteraction as any).channel;
            if (!channel || !channel.messages || typeof channel.messages.fetch !== 'function')
                return resolve(null);

            try {
                const message = await channel.messages.fetch(event.messageId);
                await message.edit({
                    components: discordContent.components,
                    files: discordContent.files,
                    flags: discordContent.flags
                });
            } catch {
                // Ignore - message might already be deleted or unreachable
            }
        }

        resolve(null);
    }

    public async getUserInputBySelectMenuAsync(event: InteractionEvent, selectMenu: SelectMenu): Promise<InteractionEvent | null> {
        return new Promise(async (resolve) => {
            // Create select menu with handlers
            const selectMenuHandler = ComponentService.createSelectMenu(selectMenu, {
                userId: event.user.userId,
                onTimeout: async () => {
                    await this.handleSelectMenuTimeoutAsync(event, selectMenuHandler, resolve);
                },
                handle: async (e: InteractionEvent) => resolve(e)
            });

            // Map and send select menu
            const title = ComponentService.createContent(createTitle(selectMenu.title ?? new MultiLingualString(i18n.labels.common.askQuestion)));
            const message = ComponentService.createContent(selectMenu.description ?? new MultiLingualString(i18n.labels.common.askQuestion));

            const discordTitle = await DiscordComponentMapper.mapComponentToDiscordComponentAsync(title);
            const discordMessage = await DiscordComponentMapper.mapComponentToDiscordComponentAsync(message);
            const discordSelectMenu = await DiscordComponentMapper.mapSelectMenuToDiscordSelectMenuAsync(selectMenuHandler);
            const replyOptions = DiscordComponentMapper.createReplyOptions([discordTitle, discordMessage, DiscordComponentMapper.createActionRowWithComponents(discordSelectMenu)], []);

            switch (event.type) {
                case EventTypeEnum.SLASH_COMMAND:
                case EventTypeEnum.MESSAGE:
                case EventTypeEnum.MESSAGE_UPDATE:
                case EventTypeEnum.MESSAGE_DELETE:
                    try {
                        await event.currentInteraction.reply(replyOptions);
                    } catch (error) {
                        if (this.isUnknownInteractionError(error)) {
                            await Logger.logWarning(`Interaction ${event.currentInteraction.id} expired before reply in channel ${event.channelId}`);
                            resolve(null);
                            return;
                        }

                        throw error;
                    }
                    break;
                case EventTypeEnum.SELECT_MENU:
                    try {
                        await event.currentInteraction.editReply(replyOptions);
                    } catch (error) {
                        if (this.isUnknownInteractionError(error)) {
                            await Logger.logWarning(`Interaction ${event.currentInteraction.id} expired before editReply in channel ${event.channelId}`);
                            resolve(null);
                            return;
                        }

                        throw error;
                    }
                    break;
                case EventTypeEnum.BUTTON:
                    try {
                        await event.currentInteraction.update(replyOptions);
                    } catch (error) {
                        if (this.isUnknownInteractionError(error)) {
                            await Logger.logWarning(`Interaction ${event.currentInteraction.id} expired before button update in channel ${event.channelId}`);
                            resolve(null);
                            return;
                        }

                        throw error;
                    }
                    break;
                default:
                    ErrorHelper.throw(ExceptionEnum.METHOD_NOT_IMPLEMENTED);
            }
        });
    }

    public async getUserInputByButtonsAsync(event: InteractionEvent, question: MultiLingualString, buttons: MultiLingualString[]): Promise<string | null> {
        return new Promise(async (resolve) => {
            const discordButtons = (await Promise.all(buttons.map(button => {
                const btn = ComponentService.createButton({
                    type: ComponentType.BUTTON,
                    label: button,
                    style: ButtonStyle.PRIMARY
                } as ActionButton, {
                    userId: event.user.userId,
                    onTimeout: async () => {
                        resolve(null);
                    },
                    handle: async (_event: InteractionEvent) => {
                        resolve(button.getMessage() ?? null);
                    }
                })
                return DiscordComponentMapper.mapButtonToDiscordButtonAsync(btn);
            }))).flat();

            const discordMessage = ComponentService.createContent(question);
            const replyOptions = DiscordComponentMapper.createReplyOptions([discordMessage, DiscordComponentMapper.createActionRowWithComponents(discordButtons)], []);

            switch (event.type) {
                case EventTypeEnum.SLASH_COMMAND:
                case EventTypeEnum.MESSAGE:
                case EventTypeEnum.MESSAGE_UPDATE:
                case EventTypeEnum.MESSAGE_DELETE:
                    await event.currentInteraction.reply(replyOptions);
                    break;
                default:
                    ErrorHelper.throw(ExceptionEnum.METHOD_NOT_IMPLEMENTED);
            }
        });
    }

    public async askUserAsync<const TFields extends Record<string, ModalField>>(
        event: InteractionEvent,
        modal: ModalDefinition<TFields>
    ): Promise<ModalResult<TFields> | null> {
        const submission = await this.showModalAndAwaitSubmissionAsync(event, modal);
        return submission ? submission.result : null;
    }

    // Same as askUserAsync, but also exposes the modal-submit event itself so callers can
    // edit the originating message afterward (the button interaction that opened the modal
    // is consumed by showModal and can no longer be used to edit that message).
    public async showModalAndAwaitSubmissionAsync<const TFields extends Record<string, ModalField>>(
        event: InteractionEvent,
        modal: ModalDefinition<TFields>
    ): Promise<{ event: ModalSubmitInteractionEvent; result: ModalResult<TFields> } | null> {
        // Showing a modal must be the FIRST response to an interaction. Buttons and slash
        // commands are un-deferred at handle time; select-menu/message events are already
        // deferred, so a modal cannot be shown from them.
        if (event.type !== EventTypeEnum.BUTTON && event.type !== EventTypeEnum.SLASH_COMMAND) {
            await Logger.logWarning(`askUserAsync is only supported from button and slash command interactions, got event type ${event.type}`);
            return null;
        }

        return new Promise<{ event: ModalSubmitInteractionEvent; result: ModalResult<TFields> } | null>(async (resolve) => {
            const customId = crypto.randomUUID();

            InteractionService.registerHandler(EventTypeEnum.MODAL_SUBMIT, {
                id: customId,
                userId: event.user.userId,
                onTimeout: async () => resolve(null),
                handle: async (submitEvent: InteractionEvent) => {
                    const modalEvent = submitEvent as ModalSubmitInteractionEvent;
                    try {
                        const result = {} as ModalResult<TFields>;
                        for (const key of Object.keys(modal.fields) as Array<keyof TFields>) {
                            const field = modal.fields[key];
                            if (field.kind === 'select') {
                                const raw = modalEvent.getSelectValues(key as string);
                                result[key] = (field.parse ? field.parse(raw) : raw) as ModalResult<TFields>[keyof TFields];
                            } else if (field.kind === 'radio') {
                                const raw = modalEvent.getRadioValue(key as string) ?? '';
                                result[key] = (field.parse ? field.parse(raw) : raw) as ModalResult<TFields>[keyof TFields];
                            } else if (field.kind === 'checkbox') {
                                const raw = modalEvent.getCheckboxValue(key as string);
                                result[key] = (field.parse ? field.parse(raw) : raw) as ModalResult<TFields>[keyof TFields];
                            } else if (field.kind === 'checkboxGroup') {
                                const raw = modalEvent.getCheckboxGroupValues(key as string);
                                result[key] = (field.parse ? field.parse(raw) : raw) as ModalResult<TFields>[keyof TFields];
                            } else if (field.kind === 'fileUpload') {
                                const raw = modalEvent.getFileUploadUrls(key as string);
                                result[key] = (field.parse ? field.parse(raw) : raw) as ModalResult<TFields>[keyof TFields];
                            } else {
                                const raw = modalEvent.getValue(key as string);
                                result[key] = (field.parse ? field.parse(raw) : raw) as ModalResult<TFields>[keyof TFields];
                            }
                        }
                        resolve({ event: modalEvent, result });
                    } catch (error) {
                        await Logger.logWarning(`Failed to parse modal submission for ${customId}: ${(error as Error).message}`);
                        resolve(null);
                    }
                }
            });

            const discordModal = DiscordModalMapper.mapModalToDiscordModal(customId, modal, event.server.LanguageEnum);
            await event.currentInteraction.showModal(discordModal);
        });
    }

    public async getConfirmationFromUser(event: InteractionEvent, components: Component[]): Promise<InteractionEvent | null> {
        return new Promise(async (resolve) => {
            const acceptButton = createAcceptButton(event.user.userId, async (btnEvent: InteractionEvent) => {
                resolve(btnEvent);
            });

            const denyButton = createDenyButton(event.user.userId, async (btnEvent: InteractionEvent) => {
                await btnEvent.editWithComponentsAsync([ComponentService.createContent(createTitle(new MultiLingualString(i18n.labels.common.cancelled)))]);    
                resolve(null);
            });

            components.push(...[acceptButton, denyButton]);
            const replyContent = await DiscordComponentMapper.buildMessageContentAsync(event, components);
            if (!replyContent)
                return null;

            switch (event.type) {
                case EventTypeEnum.SLASH_COMMAND:
                    if (event.currentInteraction.replied)
                        await event.currentInteraction.editReply(replyContent);
                    else
                        await event.currentInteraction.reply(replyContent);
                    break;
                case EventTypeEnum.MESSAGE:
                case EventTypeEnum.MESSAGE_UPDATE:
                case EventTypeEnum.MESSAGE_DELETE:
                    await event.currentInteraction.reply(replyContent);
                    break;
                case EventTypeEnum.BUTTON:
                case EventTypeEnum.SELECT_MENU:
                    await event.currentInteraction.update(replyContent);
                    break;
                default:
                    ErrorHelper.throw(ExceptionEnum.METHOD_NOT_IMPLEMENTED);
            }
        });
    }

    public async sendToChannelAsync(event: InteractionEvent, channelId: string, components: Component[]): Promise<MessageHandle | null> {
        const guild = event.currentInteraction.guild;
        if (!guild)
            ErrorHelper.throw(ExceptionEnum.DISCORD_GUILD_NOT_FOUND);

        const channel = await guild.channels.fetch(channelId);
        if (!channel || !channel.isTextBased())
            ErrorHelper.throw(ExceptionEnum.DISCORD_CHANNEL_NOT_FOUND);

        const content = await DiscordComponentMapper.buildMessageContentAsync(event, components);
        if (!content)
            return null;

        try {
            const sentMessage = await channel.send(content);
            return { channelId, messageId: sentMessage.id };
        } catch (error) {
            if (this.isMissingPermissionsError(error)) {
                await Logger.logWarning(`Missing permissions to send message to channel ${channelId} in guild ${guild.id}`);
                return null;
            }

            throw error;
        }
    }

    public async editChannelMessageAsync(event: InteractionEvent, channelId: string, messageId: string, components: Component[]): Promise<boolean> {
        const guild = event.currentInteraction.guild;
        if (!guild)
            return false;

        const channel = await guild.channels.fetch(channelId).catch(() => null);
        if (!channel || !channel.isTextBased())
            return false;

        const message = await channel.messages.fetch(messageId).catch(() => null);
        if (!message)
            return false;

        const content = await DiscordComponentMapper.buildMessageContentAsync(event, components);
        if (!content)
            return false;

        try {
            await message.edit(content);
            return true;
        } catch (error) {
            if (this.isMissingPermissionsError(error) || this.isUnknownMessageError(error)) {
                await Logger.logWarning(`Could not edit message ${messageId} in channel ${channelId}`);
                return false;
            }

            throw error;
        }
    }

    public async deleteChannelMessageAsync(event: InteractionEvent, channelId: string, messageId: string): Promise<boolean> {
        const guild = event.currentInteraction.guild;
        if (!guild)
            return false;

        const channel = await guild.channels.fetch(channelId).catch(() => null);
        if (!channel || !channel.isTextBased())
            return false;

        const message = await channel.messages.fetch(messageId).catch(() => null);
        if (!message)
            return false;

        try {
            await message.delete();
            return true;
        } catch (error) {
            if (this.isMissingPermissionsError(error) || this.isUnknownMessageError(error)) {
                await Logger.logWarning(`Could not delete message ${messageId} in channel ${channelId}`);
                return false;
            }

            throw error;
        }
    }

    public async editGuildChannelMessageAsync(channelId: string, messageId: string, components: Component[], server: ServersModel): Promise<{ success: boolean; noLongerEditable?: boolean }> {
        const channel = await discordClient.channels.fetch(channelId).catch(() => null);
        if (!channel || !channel.isTextBased())
            return { success: false };

        const message = await channel.messages.fetch(messageId).catch(() => null);
        if (!message)
            return { success: false };

        const renderContext: RenderContext = { server, components: [] };
        const content = await DiscordComponentMapper.buildMessageContentAsync(renderContext, components);
        if (!content)
            return { success: false };

        try {
            await message.edit(content);
            return { success: true };
        } catch (error) {
            if (error instanceof DiscordAPIError && error.code === RESTJSONErrorCodes.CannotEditMessageAuthoredByAnotherUser)
                return { success: false, noLongerEditable: true };

            if (this.isMissingPermissionsError(error)) {
                await Logger.logWarning(`Missing permissions to edit message ${messageId} in channel ${channelId}`);
                return { success: false };
            }

            throw error;
        }
    }

    public async sendToGuildChannelAsync(guild: DiscordGuild, channelId: string, components: Component[], server: ServersModel): Promise<void> {
        const channel = await guild.channels.fetch(channelId).catch(() => null);
        if (!channel || !channel.isTextBased())
            return;

        const renderContext: RenderContext = { server, components: [] };

        const content = await DiscordComponentMapper.buildMessageContentAsync(renderContext, components);
        if (!content)
            return;

        try {
            await channel.send(content);
        } catch (error) {
            if (this.isMissingPermissionsError(error)) {
                await Logger.logWarning(`Missing permissions to send welcome message to channel ${channelId} in guild ${guild.id}`);
                return;
            }

            throw error;
        }
    }
}

export default new DiscordMessageHandler();