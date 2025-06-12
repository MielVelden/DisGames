import {
    User as DiscordUser,

    ChatInputCommandInteraction as DiscordChatInputCommandInteraction,
    ButtonInteraction as DiscordButtonInteraction,
    ButtonBuilder as DiscordButtonBuilder,
    Message as DiscordMessage,
    StringSelectMenuInteraction as DiscordStringSelectMenuInteraction
} from 'discord.js';
import { InteractionEvent } from '../../../interfaces/application/Event';
import { ActionButton, ButtonStyle, ComponentType, SelectMenu } from '../../../interfaces/application/Message';
import {
    Component
} from '../../../interfaces/application/Message';
import ComponentService from '../../ComponentService';
import { MultiLingualString } from '../../../utils/i18n/MultiLangualString';
import { EventService } from '../../EventService';
import { i18n } from '../../../utils/i18n/i18n';
import DiscordComponentMapper from '../mappers/DiscordComponentMapper';
import { DiscordMessageContent, DiscordMessageInteraction } from '../DiscordService';

class DiscordMessageHandler {
    public async sendMessageAsync(user: DiscordUser, message: string): Promise<void> {
        await user.send(message);
    }

    public async replyAsync(event: InteractionEvent, message: MultiLingualString | undefined): Promise<void> {
        const content = await DiscordComponentMapper.buildMessageContentAsync(event, message);
        if (!content) return;

        await this.handleInteractionReplyAsync(event, content);
    }

    public async sendAsync(event: InteractionEvent, message: MultiLingualString | undefined): Promise<void> {
        const content = await DiscordComponentMapper.buildMessageContentAsync(event, message);
        if (!content) return;

        const guild = event.currentInteraction.guild;
        if (!guild) {
            throw new Error("Guild not found");
        }

        const channel = await guild.channels.fetch(event.channelId);
        if (!channel || !channel.isTextBased()) {
            throw new Error("Channel not found or not text-based");
        }

        await channel.send(content);
    }

    public async editWithComponentAsync(event: InteractionEvent, component: Component): Promise<void> {
        event.clearComponentsAsync();
        await event.addComponentAsync(component);
        await this.editAsync(event, "");
    }

    public async editAsync(event: InteractionEvent, message: MultiLingualString | string): Promise<void> {
        const content = await DiscordComponentMapper.buildMessageContentAsync(event, message);
        if (!content) return;

        await this.handleInteractionEditAsync(event, content);
    }

    public async deleteAsync(interaction: DiscordChatInputCommandInteraction | DiscordButtonInteraction | DiscordMessage): Promise<void> {
        // Mark message as internally deleted before deleting
        if (interaction instanceof DiscordMessage) {
            EventService.markMessageAsInternallyDeleted(interaction.id);
            await interaction.delete();
        } else {
            // For button interactions, we can get the message ID
            if (interaction instanceof DiscordButtonInteraction && interaction.message)
                EventService.markMessageAsInternallyDeleted(interaction.message.id);

            await interaction.deleteReply();
        }
    }

    public async reactAsync(interaction: DiscordMessageInteraction | DiscordMessage, emoji: string): Promise<void> {
        if (interaction instanceof DiscordMessage)
            await interaction.react(emoji);
        else
            await interaction.message.react(emoji);
    }

    public async deferUpdateAsync(interaction: DiscordStringSelectMenuInteraction): Promise<void> {
        await interaction.deferUpdate();
    }


    public async handleInteractionReplyAsync(event: InteractionEvent, content: DiscordMessageContent): Promise<void> {
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
        } else if (event.currentInteraction instanceof DiscordStringSelectMenuInteraction) {
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
        await event.addComponentAsync(selectMenu);

        // Edit the message to show the timeout
        await this.editAsync(event, new MultiLingualString(i18n.common.timedOut));
        resolve(null);
    }

    public async getUserInputBySelectMenuAsync(event: InteractionEvent, selectMenu: SelectMenu): Promise<InteractionEvent | null> {
        return new Promise(async (resolve) => {
            // Create select menu with handlers
            const selectMenuHandler = ComponentService.createSelectMenu(selectMenu, {
                userId: event.user.id,
                onTimeout: async () => {
                    await this.handleSelectMenuTimeoutAsync(event, selectMenuHandler, resolve);
                },
                handle: async (e: InteractionEvent) => resolve(e)
            });

            // Map and send select menu
            const discordSelectMenu = await DiscordComponentMapper.mapSelectMenuToDiscordSelectMenuAsync(selectMenuHandler);
            const replyOptions = {
                content: "test",
                components: [DiscordComponentMapper.createActionRowWithComponents(discordSelectMenu)]
            };

            if (event.currentInteraction instanceof DiscordChatInputCommandInteraction ||
                event.currentInteraction instanceof DiscordMessage) {
                await event.currentInteraction.reply(replyOptions);
            } else
                throw new Error("Not implemented yet");
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
                    userId: event.user.id,
                    onTimeout: async () => {
                        resolve(null);
                    },
                    handle: async (event: InteractionEvent) => {
                        resolve(button.getMessage() ?? null);
                    }
                })
                return DiscordComponentMapper.mapButtonToDiscordButtonAsync(btn);
            }));

            if (event.currentInteraction instanceof DiscordChatInputCommandInteraction) {
                await event.currentInteraction.reply({
                    content: question.getMessage(),
                    components: [DiscordComponentMapper.createActionRowWithComponents(discordButtons)]
                });
            } else if (event.currentInteraction instanceof DiscordMessage) {
                await event.currentInteraction.reply({
                    content: question.getMessage(),
                    components: [DiscordComponentMapper.createActionRowWithComponents(discordButtons)]
                });
            } else {
                throw new Error("Not implemented yet");
            }
        });
    }
}

export default new DiscordMessageHandler();