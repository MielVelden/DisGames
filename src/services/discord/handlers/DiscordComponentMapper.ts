import {
    StringSelectMenuBuilder as DiscordStringSelectMenuBuilder,
    UserSelectMenuBuilder as DiscordUserSelectMenuBuilder,
    RoleSelectMenuBuilder as DiscordRoleSelectMenuBuilder,
    MentionableSelectMenuBuilder as DiscordMentionableSelectMenuBuilder,
    ChannelSelectMenuBuilder as DiscordChannelSelectMenuBuilder,
    ButtonBuilder as DiscordButtonBuilder,
    ActionRowBuilder as DiscordActionRowBuilder} from 'discord.js';
import { SelectMenuOptionBuilder as DiscordSelectMenuOptionBuilder } from '@discordjs/builders';
import { InteractionEvent } from '../../../interfaces/application/Event';
import { ActionButton, ComponentType, SelectMenu, SelectOption, TextDisplay } from '../../../interfaces/application/Message';
import {
    StringSelect,
    UserSelect,
    RoleSelect,
    MentionableSelect,
    ChannelSelect,
    Component
} from '../../../interfaces/application/Message';
import { MultiLingualString } from '../../../utils/i18n/MultiLangualString';
import DiscordEnumMapper from './DiscordEnumMapper';
import { DiscordComponentBuilder, DiscordMessageContent, DiscordSelectMenuBuilder } from '../DiscordService';

class DiscordComponentMapper {
    public mapSelectMenuOptionToDiscordSelectMenuOption(option: SelectOption): DiscordSelectMenuOptionBuilder {
        const discordSelectMenuOption = new DiscordSelectMenuOptionBuilder()
            .setLabel(option.label.getMessage())
            .setDescription(option.description?.getMessage() || "")
            .setValue(option.value);

        if (option.emoji)
            discordSelectMenuOption.setEmoji({ name: option.emoji });

        return discordSelectMenuOption;
    }

    public async mapSelectMenuToDiscordSelectMenuAsync(selectMenu: SelectMenu): Promise<DiscordSelectMenuBuilder> {
        switch (selectMenu.type) {
            case ComponentType.STRING_SELECT: {
                const stringSelect = selectMenu as StringSelect;
                const discordSelectMenu = new DiscordStringSelectMenuBuilder()
                    .setCustomId(stringSelect.custom_id)
                    .setDisabled(stringSelect.disabled || false)
                    .setPlaceholder(stringSelect.placeholder?.getMessage() || "Select an option")
                    .setMinValues(stringSelect.min_values || 1)
                    .setMaxValues(stringSelect.max_values || 1);

                if (stringSelect.options) {
                    stringSelect.options.forEach(option => {
                        discordSelectMenu.addOptions(this.mapSelectMenuOptionToDiscordSelectMenuOption(option));
                    });
                }

                return discordSelectMenu;
            }
            case ComponentType.USER_SELECT: {
                const userSelect = selectMenu as UserSelect;
                const discordSelectMenu = new DiscordUserSelectMenuBuilder()
                    .setCustomId(userSelect.custom_id)
                    .setDisabled(userSelect.disabled || false)
                    .setPlaceholder(userSelect.placeholder?.getMessage() || "Select a user")
                    .setMinValues(userSelect.min_values || 1)
                    .setMaxValues(userSelect.max_values || 1);

                if (userSelect.default_values) {
                    discordSelectMenu.setDefaultUsers(userSelect.default_values.map(dv => dv.id));
                }

                return discordSelectMenu;
            }
            case ComponentType.ROLE_SELECT: {
                const roleSelect = selectMenu as RoleSelect;
                const discordSelectMenu = new DiscordRoleSelectMenuBuilder()
                    .setCustomId(roleSelect.custom_id)
                    .setDisabled(roleSelect.disabled || false)
                    .setPlaceholder(roleSelect.placeholder?.getMessage() || "Select a role")
                    .setMinValues(roleSelect.min_values || 1)
                    .setMaxValues(roleSelect.max_values || 1);

                if (roleSelect.default_values) {
                    discordSelectMenu.setDefaultRoles(roleSelect.default_values.map(dv => dv.id));
                }

                return discordSelectMenu;
            }
            case ComponentType.MENTIONABLE_SELECT: {
                const mentionableSelect = selectMenu as MentionableSelect;
                const discordSelectMenu = new DiscordMentionableSelectMenuBuilder()
                    .setCustomId(mentionableSelect.custom_id)
                    .setDisabled(mentionableSelect.disabled || false)
                    .setPlaceholder(mentionableSelect.placeholder?.getMessage() || "Select a mentionable")
                    .setMinValues(mentionableSelect.min_values || 1)
                    .setMaxValues(mentionableSelect.max_values || 1);

                return discordSelectMenu;
            }
            case ComponentType.CHANNEL_SELECT: {
                const channelSelect = selectMenu as ChannelSelect;
                const discordSelectMenu = new DiscordChannelSelectMenuBuilder()
                    .setCustomId(channelSelect.custom_id)
                    .setDisabled(channelSelect.disabled || false)
                    .setPlaceholder(channelSelect.placeholder?.getMessage() || "Select a channel")
                    .setMinValues(channelSelect.min_values || 1)
                    .setMaxValues(channelSelect.max_values || 1);

                if (channelSelect.channel_types) {
                    discordSelectMenu.setChannelTypes(channelSelect.channel_types);
                }

                if (channelSelect.default_values) {
                    discordSelectMenu.setDefaultChannels(channelSelect.default_values.map(dv => dv.id));
                }

                return discordSelectMenu;
            }
            default:
                throw new Error(`Unhandled select menu type: ${(selectMenu as any).type}`);
        }
    }

    public async mapButtonToDiscordButtonAsync(button: ActionButton): Promise<DiscordButtonBuilder> {
        const discordButton = new DiscordButtonBuilder()
            .setCustomId(button.custom_id)
            .setLabel(button.label?.getMessage() || "Button")
            .setStyle(DiscordEnumMapper.mapButtonStyleToDiscordButtonStyle(button.style));

        if (button.emoji) {
            if (typeof button.emoji === "string")
                discordButton.setEmoji(button.emoji);
            else
                discordButton.setEmoji({
                    name: button.emoji.name,
                    id: button.emoji.id,
                    animated: button.emoji.animated
                });
        }

        if (button.disabled)
            discordButton.setDisabled(true);

        return discordButton;
    }

    public async mapComponentToDiscordComponentAsync(component: Component): Promise<DiscordComponentBuilder> {
        switch (component.type) {
            case ComponentType.BUTTON:
                return await this.mapButtonToDiscordButtonAsync(component as ActionButton);
            case ComponentType.TEXT_DISPLAY:
                throw new Error('TextDisplay components should not be mapped to Discord components');
            case ComponentType.STRING_SELECT:
            case ComponentType.USER_SELECT:
            case ComponentType.ROLE_SELECT:
            case ComponentType.MENTIONABLE_SELECT:
            case ComponentType.CHANNEL_SELECT:
                return await this.mapSelectMenuToDiscordSelectMenuAsync(component as SelectMenu);
            default:
                throw new Error(`Unhandled component type: ${component.type}`);
        }
    }

    public createActionRowWithComponents(components: DiscordComponentBuilder | DiscordComponentBuilder[]): DiscordActionRowBuilder<any> {
        const componentArray = Array.isArray(components) ? components : [components];
        return new DiscordActionRowBuilder<any>().addComponents(componentArray);
    }

    public async mapActionRowComponents(interaction: InteractionEvent): Promise<DiscordActionRowBuilder<any>> {
        const nonTextDisplayComponents = interaction.components.filter(component => component.type !== ComponentType.TEXT_DISPLAY);
        const components = await Promise.all(nonTextDisplayComponents.map(component => this.mapComponentToDiscordComponentAsync(component)));
        return this.createActionRowWithComponents(components);
    }

    // #region Component handling
    public async addComponentAsync(event: InteractionEvent, component: Component): Promise<void> {
        event.components.push(component);
    }

    public async addComponentsAsync(event: InteractionEvent, components: Component[]): Promise<void> {
        components.forEach(component => this.addComponentAsync(event, component));
    }

    public async clearComponentsAsync(event: InteractionEvent): Promise<void> {
        event.components = [];
    }
    // #endregion

    public async buildMessageContentAsync(event: InteractionEvent, message?: MultiLingualString | string): Promise<DiscordMessageContent | null> {
        const components = await this.mapActionRowComponents(event);
        const textDisplayContent = this.extractTextDisplayContent(event);

        const messageContent = typeof message === 'string' ? message : message?.getMessage() ?? '';
        const finalContent = textDisplayContent ?
            (messageContent ? `${messageContent}\n${textDisplayContent}` : textDisplayContent) :
            messageContent;

        if (!finalContent && components.components.length === 0) {
            return null;
        }

        return {
            content: finalContent,
            components: components.components.length > 0 ? [components] : []
        };
    }

    public extractTextDisplayContent(interaction: InteractionEvent): string {
        const textDisplayComponents = interaction.components.filter(component => component.type === ComponentType.TEXT_DISPLAY) as TextDisplay[];
        return textDisplayComponents.map(component => component.content.getMessage()).join('\n');
    }

}

export default new DiscordComponentMapper();