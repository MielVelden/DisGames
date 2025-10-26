import {
    User as DiscordUser,

    ChatInputCommandInteraction as DiscordChatInputCommandInteraction,
    ButtonInteraction as DiscordButtonInteraction,
    ButtonBuilder as DiscordButtonBuilder,
    Message as DiscordMessage,
    StringSelectMenuInteraction as DiscordStringSelectMenuInteraction,
    ChannelSelectMenuInteraction as DiscordChannelSelectMenuInteraction
} from 'discord.js';
import { InteractionEvent, MessageInteractionEvent } from '../../../interfaces/application/Event';
import { ActionButton, ButtonStyle, ComponentType, SelectMenu } from '../../../interfaces/application/Message';
import {
    Component
} from '../../../interfaces/application/Message';
import ComponentService from '../../application/ComponentService';
import { createMultiLingualString, MultiLingualString } from '../../../utils/i18n/MultiLingualString';
import { EventService } from '../../application/EventService';
import { i18n } from '../../../utils/i18n/i18n';
import DiscordComponentMapper from '../mappers/DiscordComponentMapper';
import { DiscordMessageContent, DiscordMessageInteraction } from '../DiscordService';
import { createAcceptButton } from '../../../builders/buttons/AcceptButton';
import { createDenyButton } from '../../../builders/buttons/DenyButton';
import { ExceptionEnum } from '../../../interfaces/enums';
import { ErrorHelper } from '../../../utils/application/Error';

class DiscordMessageHandler {
    public async sendMessageAsync(user: DiscordUser, message: string): Promise<void> {
        await user.send(message);
    }

    public async replyAsync(event: InteractionEvent, message: MultiLingualString | undefined): Promise<void> {
        const content = await DiscordComponentMapper.buildMessageContentAsync(event, event.components, message);
        if (!content) return;

        await this.handleInteractionReplyAsync(event as MessageInteractionEvent, content);
    }

    public async sendAsync(event: InteractionEvent, message: MultiLingualString | undefined): Promise<void> {
        const content = await DiscordComponentMapper.buildMessageContentAsync(event, event.components, message);
        if (!content) return;

        const guild = event.currentInteraction.guild;
        if (!guild)
            throw new Error("Guild not found");

        const channel = await guild.channels.fetch(event.channelId);
        if (!channel || !channel.isTextBased())
            throw new Error("Channel not found or not text-based");

        await channel.send(content);
    }

    public async editWithComponentAsync(event: InteractionEvent, component: Component): Promise<void> {
        event.clearComponentsAsync();
        await event.addComponentAsync(component);
        await this.editAsync(event);
    }

    public async editAsync(event: InteractionEvent, message?: MultiLingualString | string): Promise<void> {
        const content = await DiscordComponentMapper.buildMessageContentAsync(event, event.components, message);
        if (!content) 
            return;

        await this.handleInteractionEditAsync(event, content);
    }

    public async deleteAsync(event: MessageInteractionEvent): Promise<void> {
        // Mark message as internally deleted before deleting
        if (event.messageDeleted)
            return;

        event.messageDeleted = true;

        if (event.currentInteraction instanceof DiscordMessage) {
            EventService.markMessageAsInternallyDeleted(event.currentInteraction.id);
            await event.currentInteraction.delete();
        } else {
            // For button interactions, we can get the message ID
            if (event.currentInteraction instanceof DiscordButtonInteraction && event.currentInteraction.message)
                EventService.markMessageAsInternallyDeleted(event.currentInteraction.message.id);

            if (event.currentInteraction instanceof DiscordButtonInteraction)
                await event.currentInteraction.deleteReply();
        }
    }

    public async reactAsync(interaction: DiscordMessageInteraction | DiscordMessage, emoji: string): Promise<void> {
        if (interaction instanceof DiscordMessage)
            await interaction.react(emoji);
        else
            await interaction.message.react(emoji);
    }

    public async deferUpdateAsync(interaction: DiscordStringSelectMenuInteraction | DiscordChannelSelectMenuInteraction): Promise<void> {
        await interaction.deferUpdate();
    }


    public async handleInteractionReplyAsync(event: MessageInteractionEvent, content: DiscordMessageContent): Promise<void> {
        // If the message is deleted, don't reply
        if (event.messageDeleted)
            return;

        if (event.currentInteraction instanceof DiscordChatInputCommandInteraction) {
            if (event.currentInteraction.replied) {
                await event.currentInteraction.editReply({
                    ...content,
                    content: null
                });
            } else {
                await event.currentInteraction.reply(content);
            }
        } else if (event.currentInteraction instanceof DiscordMessage) {
            if (event.currentInteraction.resolved) {
                await event.currentInteraction.edit(content);
            } else {
                await event.currentInteraction.reply(content);
            }
        } else if (event.currentInteraction instanceof DiscordButtonInteraction) {
            await event.currentInteraction.update(content);
        } else if (event.currentInteraction instanceof DiscordStringSelectMenuInteraction) {
            await event.currentInteraction.update(content);
        } else {
            throw new Error("Not implemented yet");
        }
    }

    public async handleInteractionEditAsync(event: InteractionEvent, content: DiscordMessageContent): Promise<void> {
        if (event.currentInteraction instanceof DiscordChatInputCommandInteraction) {
            await event.currentInteraction.editReply(content);
        } else if (event.currentInteraction instanceof DiscordMessage) {
            await event.currentInteraction.edit(content);
        } else if (event.currentInteraction instanceof DiscordButtonInteraction) {
            await event.currentInteraction.update(content);
        } else if (event.currentInteraction instanceof DiscordStringSelectMenuInteraction || event.currentInteraction instanceof DiscordChannelSelectMenuInteraction) {
            if (event.currentInteraction.deferred) {
                await event.currentInteraction.editReply(content);
            } else {
                await event.currentInteraction.update(content);
            }
        } else {
            throw new Error("Not implemented yet");
        }
    }

    private async handleSelectMenuTimeoutAsync(event: InteractionEvent, selectMenu: SelectMenu, resolve: (value: InteractionEvent | null) => void): Promise<void> {
        // Disable the select menu
        selectMenu.disabled = true;

        // Clear the components and add the select menu back to the components
        await event.clearComponentsAsync();
        await event.addComponentAsync(ComponentService.createContainer({
            description: new MultiLingualString(i18n.labels.common.timedOut)
        }));

        await event.addComponentAsync(selectMenu);

        // Edit the message to show the timeout
        await this.editAsync(event);
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
            const message = ComponentService.createContainer({
                description: selectMenu.question ?? new MultiLingualString(i18n.labels.common.askQuestion)
            });

            const discordMessage = await DiscordComponentMapper.mapComponentToDiscordComponentAsync(message);
            const discordSelectMenu = await DiscordComponentMapper.mapSelectMenuToDiscordSelectMenuAsync(selectMenuHandler);
            const replyOptions = DiscordComponentMapper.createReplyOptions([discordMessage, DiscordComponentMapper.createActionRowWithComponents(discordSelectMenu)], []);

            if (event.currentInteraction instanceof DiscordChatInputCommandInteraction ||
                event.currentInteraction instanceof DiscordMessage) {
                await event.currentInteraction.reply(replyOptions);
            } else if (event.currentInteraction instanceof DiscordStringSelectMenuInteraction) {
                await event.currentInteraction.editReply(replyOptions);
            } else if (event.currentInteraction instanceof DiscordButtonInteraction) {
                await event.currentInteraction.update(replyOptions);
            } else
                ErrorHelper.throw(ExceptionEnum.METHOD_NOT_IMPLEMENTED);
        });
    }

    public async getUserInputByButtonsAsync(event: InteractionEvent, question: MultiLingualString, buttons: MultiLingualString[]): Promise<string | null> {
        return new Promise(async (resolve) => {
            const discordButtons = await Promise.all(buttons.map(button => {
                const btn = ComponentService.createButton({
                    type: ComponentType.BUTTON,
                    label: button,
                    style: ButtonStyle.PRIMARY
                } as ActionButton, {
                    userId: event.user.userId,
                    onTimeout: async () => {
                        resolve(null);
                    },
                    handle: async (event: InteractionEvent) => {
                        resolve(button.getMessage() ?? null);
                    }
                })
                return DiscordComponentMapper.mapButtonToDiscordButtonAsync(btn);
            }));

            const discordMessage = ComponentService.createContent(question);
            const replyOptions = DiscordComponentMapper.createReplyOptions([discordMessage, DiscordComponentMapper.createActionRowWithComponents(discordButtons)], []);

            if (event.currentInteraction instanceof DiscordChatInputCommandInteraction)
                await event.currentInteraction.reply(replyOptions);
            else if (event.currentInteraction instanceof DiscordMessage)
                await event.currentInteraction.reply(replyOptions);
            else 
                ErrorHelper.throw(ExceptionEnum.METHOD_NOT_IMPLEMENTED);
        });
    }

    public async getConfirmationFromUser(event: InteractionEvent, container: Component): Promise<InteractionEvent | null> {
        return new Promise(async (resolve) => {
            const acceptButton = createAcceptButton(event.user.userId, async (btnEvent: InteractionEvent) => {
                resolve(btnEvent);
            });

            const denyButton = createDenyButton(event.user.userId, async (btnEvent: InteractionEvent) => {
                await btnEvent.editWithComponentAsync(ComponentService.createContainer({
                    description: new MultiLingualString(i18n.labels.common.cancelled)
                }));
                resolve(null);
            });

            const discordAcceptButton = await DiscordComponentMapper.mapButtonToDiscordButtonAsync(acceptButton);
            const discordDenyButton = await DiscordComponentMapper.mapButtonToDiscordButtonAsync(denyButton);

            const discordContainer = await DiscordComponentMapper.mapComponentToDiscordComponentAsync(container);

            const replyOptions = DiscordComponentMapper.createReplyOptions(
                [discordContainer, DiscordComponentMapper.createActionRowWithComponents([discordAcceptButton, discordDenyButton])], 
                []
            );

            if (event.currentInteraction instanceof DiscordChatInputCommandInteraction) {
                if (event.currentInteraction.replied)
                    await event.currentInteraction.editReply(replyOptions);
                else
                    await event.currentInteraction.reply(replyOptions);
            } else if (event.currentInteraction instanceof DiscordMessage) {
                await event.currentInteraction.reply(replyOptions);
            } else if (event.currentInteraction instanceof DiscordButtonInteraction) {
                await event.currentInteraction.update(replyOptions);
            } else if (event.currentInteraction instanceof DiscordStringSelectMenuInteraction) {
                await event.currentInteraction.update(replyOptions);
            } else {
                ErrorHelper.throw(ExceptionEnum.METHOD_NOT_IMPLEMENTED);
            }
        });
    }

    public async sendToChannelAsync(event: InteractionEvent, channelId: string, components: Component[]): Promise<void> {
        const guild = event.currentInteraction.guild;
        if (!guild)
            ErrorHelper.throw(ExceptionEnum.DISCORD_GUILD_NOT_FOUND);

        const channel = await guild.channels.fetch(channelId);
        if (!channel || !channel.isTextBased())
            ErrorHelper.throw(ExceptionEnum.DISCORD_CHANNEL_NOT_FOUND);

        const content = await DiscordComponentMapper.buildMessageContentAsync(event, components);
        if (!content)
            return;

        await channel.send(content);
    }
}

export default new DiscordMessageHandler();