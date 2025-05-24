import {
    Interaction as DiscordInteraction,
    User as DiscordUser,
    GuildMember as DiscordGuildMember,
    PermissionResolvable, PermissionsBitField,
    ChatInputCommandInteraction as DiscordChatInputCommandInteraction,
    ButtonInteraction as DiscordButtonInteraction,
    MessageComponentInteraction as DiscordMessageComponentInteraction,
    StringSelectMenuBuilder as DiscordStringSelectMenuBuilder,
    StringSelectMenuInteraction as DiscordStringSelectMenuInteraction,
    UserSelectMenuBuilder as DiscordUserSelectMenuBuilder,
    RoleSelectMenuBuilder as DiscordRoleSelectMenuBuilder,
    MentionableSelectMenuBuilder as DiscordMentionableSelectMenuBuilder,
    ChannelSelectMenuBuilder as DiscordChannelSelectMenuBuilder,
    ButtonBuilder as DiscordButtonBuilder,
    ButtonStyle as DiscordButtonStyle,
    ActionRowBuilder as DiscordActionRowBuilder,
    Component as DiscordComponent
} from 'discord.js';
import { ButtonHandler, SelectMenuHandler, InteractionEvent } from '../interfaces/application/Event';
import { User } from '../interfaces/domain/User';
import { Permission } from '../interfaces/application/Permission';
import { ActionButton, ButtonStyle, ComponentType } from '../interfaces/application/Message';
import { 
    BaseSelectMenu, 
    StringSelect, 
    UserSelect, 
    RoleSelect, 
    MentionableSelect, 
    ChannelSelect,
    Component
} from '../interfaces/application/Message';

type DiscordMessageInteraction = DiscordButtonInteraction | DiscordMessageComponentInteraction;
type SelectMenu = StringSelect | UserSelect | RoleSelect | MentionableSelect | ChannelSelect;
type DiscordSelectMenuBuilder = DiscordStringSelectMenuBuilder | DiscordUserSelectMenuBuilder | DiscordRoleSelectMenuBuilder | DiscordMentionableSelectMenuBuilder | DiscordChannelSelectMenuBuilder;
type DiscordComponentBuilder = DiscordButtonBuilder | DiscordSelectMenuBuilder;

class DiscordService {
    // #region Mappers
    public async mapInteractionToInteractionEventAsync(interaction: DiscordInteraction): Promise<InteractionEvent> {
        const user = await this.mapDiscordUserToUser(interaction.user, interaction.member as DiscordGuildMember);

        if (interaction.isChatInputCommand()) {

            return {
                customId: interaction.id,
                user: user,
                channelId: interaction.channelId!,
                guildId: interaction.guildId!,
                messageId: interaction.id,

                addComponentAsync: async (component: Component) => { throw new Error("Not implemented yet"); },
                addComponentsAsync: async (components: Component[]) => { throw new Error("Not implemented yet"); },
                replyAsync: async (content?: string) => await this.replyAsync(interaction, content || ""),
                deleteAsync: async () => await this.deleteAsync(interaction),
                editAsync: async (content?: string) => await this.editAsync(interaction, content || ""),
                reactAsync: async (emoji: string) => { throw new Error("Not implemented yet"); },
                getOption: (name: string) => this.getOption(interaction, name),

                //getUserInputBySelectMenuAsync: async (selectMenu: SelectMenu) => await this.getUserInputBySelectMenuAsync(interaction, selectMenu),
                //getUserInputByButtonsAsync: async (question: string, buttons: ActionButton[]) => await this.getUserInputByButtonsAsync(interaction, question, buttons),
            } as InteractionEvent;
        } else if (interaction.isButton()) {

        }
        return {
            customId: interaction.id,
            user: user,
            channelId: interaction.channelId!,
            guildId: interaction.guildId!,
            messageId: interaction.id,
            addComponentAsync: async (component: Component) => { throw new Error("Not implemented yet"); },
            addComponentsAsync: async (components: Component[]) => { throw new Error("Not implemented yet"); },
            replyAsync: async (content?: string) => { throw new Error("Not implemented yet"); },
            deleteAsync: async () => { throw new Error("Not implemented yet"); },
            editAsync: async (content?: string) => { throw new Error("Not implemented yet"); },
            reactAsync: async (emoji: string) => { throw new Error("Not implemented yet"); },
            getOption: (name: string) => undefined,
            getUserInputBySelectMenuAsync: (() => { throw new Error("Not implemented yet"); }) as any,
        };
    }

    private async mapDiscordUserToUser(user: DiscordUser, member: DiscordGuildMember): Promise<User> {
        return {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            bot: user.bot,
            hasPermission: (permission: Permission) => this.checkUserHasPermission(member, permission),
            hasPermissions: (permissions: Permission[]) => this.checkUserHasPermissions(member, permissions),
            sendMessageAsync: async (message: string) => await this.sendMessageAsync(user, message),
        } as User;
    }

    private async mapSelectMenuToDiscordSelectMenuAsync(selectMenu: SelectMenu): Promise<DiscordSelectMenuBuilder> {
        switch (selectMenu.type) {
            case ComponentType.STRING_SELECT: {
                const stringSelect = selectMenu as StringSelect;
                const discordSelectMenu = new DiscordStringSelectMenuBuilder()
                    .setCustomId(stringSelect.custom_id)
                    .setPlaceholder(stringSelect.placeholder || "Select an option")
                    .setMinValues(stringSelect.min_values || 1)
                    .setMaxValues(stringSelect.max_values || 1);

                if (stringSelect.options) {
                    stringSelect.options.forEach(option => {
                        discordSelectMenu.addOptions(option);
                    });
                }
                
                return discordSelectMenu;
            }
            case ComponentType.USER_SELECT: {
                const userSelect = selectMenu as UserSelect;
                const discordSelectMenu = new DiscordUserSelectMenuBuilder()
                    .setCustomId(userSelect.custom_id)
                    .setPlaceholder(userSelect.placeholder || "Select a user")
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
                    .setPlaceholder(roleSelect.placeholder || "Select a role")
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
                    .setPlaceholder(mentionableSelect.placeholder || "Select a mentionable")
                    .setMinValues(mentionableSelect.min_values || 1)
                    .setMaxValues(mentionableSelect.max_values || 1);
                
                return discordSelectMenu;
            }
            case ComponentType.CHANNEL_SELECT: {
                const channelSelect = selectMenu as ChannelSelect;
                const discordSelectMenu = new DiscordChannelSelectMenuBuilder()
                    .setCustomId(channelSelect.custom_id)
                    .setPlaceholder(channelSelect.placeholder || "Select a channel")
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

    private async mapButtonToDiscordButtonAsync(button: ActionButton): Promise<DiscordButtonBuilder> {
        const discordButton = new DiscordButtonBuilder()
            .setCustomId(button.custom_id)
            .setLabel(button.label || "Button")
            .setStyle(this.mapButtonStyleToDiscordButtonStyle(button.style));

        if (button.emoji)
            discordButton.setEmoji({
                name: button.emoji.name,
                id: button.emoji.id,
                animated: button.emoji.animated
            });


        if (button.disabled)
            discordButton.setDisabled(true);

        return discordButton;
    }

    private async mapComponentToDiscordComponent(component: Component): Promise<DiscordComponentBuilder> {
        switch (component.type) {
            case ComponentType.BUTTON:
                return await this.mapButtonToDiscordButtonAsync(component as ActionButton);
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

    private createActionRowWithComponents(components: DiscordComponentBuilder | DiscordComponentBuilder[]): DiscordActionRowBuilder<any> {
        const componentArray = Array.isArray(components) ? components : [components];
        return new DiscordActionRowBuilder<any>().addComponents(componentArray);
    }
    // #endregion

    // #region Enum mappers
    private mapPermissionToDiscordPermission(permission: Permission): PermissionResolvable {
        const permissionMap = {
            [Permission.ADMINISTRATOR]: PermissionsBitField.Flags.Administrator,
            [Permission.MANAGE_CHANNELS]: PermissionsBitField.Flags.ManageChannels,
            [Permission.MANAGE_GUILD]: PermissionsBitField.Flags.ManageGuild,
            [Permission.MANAGE_MESSAGES]: PermissionsBitField.Flags.ManageMessages
        } as const;

        const permissionValue = permissionMap[permission];
        if (!permissionValue)
            throw new Error(`Unhandled permission type: ${permission}`);

        return permissionValue;
    }

    private mapButtonStyleToDiscordButtonStyle(style: ButtonStyle): DiscordButtonStyle {
        const buttonStyleMap = {
            [ButtonStyle.PRIMARY]: DiscordButtonStyle.Primary,
            [ButtonStyle.SECONDARY]: DiscordButtonStyle.Secondary,
            [ButtonStyle.SUCCESS]: DiscordButtonStyle.Success,
            [ButtonStyle.DANGER]: DiscordButtonStyle.Danger,
            [ButtonStyle.LINK]: DiscordButtonStyle.Link,
            [ButtonStyle.PREMIUM]: DiscordButtonStyle.Link
        } as const;

        const buttonStyleValue = buttonStyleMap[style];
        if (!buttonStyleValue)
            throw new Error(`Unhandled button style type: ${style}`);

        return buttonStyleValue;
    }
    // #endregion

    private getOption(interaction: DiscordChatInputCommandInteraction, name: string): string | number | boolean | undefined {
        const option = interaction.options.get(name);
        return option?.value;
    }

    // #region Message interaction
    private async sendMessageAsync(user: DiscordUser, message: string): Promise<void> {
        await user.send(message);
    }

    private async replyAsync(interaction: DiscordChatInputCommandInteraction, message: string): Promise<void> {
        await interaction.reply(message);
    }

    private async editAsync(interaction: DiscordInteraction, message: string): Promise<void> {
        if (interaction.isChatInputCommand()) {
            await interaction.editReply(message);
        } else if (interaction.isMessageComponent() || interaction.isButton()) {
            await interaction.update(message);
        }
    }

    private async deleteAsync(interaction: DiscordChatInputCommandInteraction): Promise<void> {
        await interaction.deleteReply();
    }

    private async reactAsync(interaction: DiscordMessageInteraction, emoji: string): Promise<void> {
        await interaction.message.react(emoji);
    }

    private async getUserInputBySelectMenuAsync(interaction: DiscordMessageInteraction, selectMenu: SelectMenu): Promise<InteractionEvent> {
        const discordSelectMenu = await this.mapSelectMenuToDiscordSelectMenuAsync(selectMenu);
        const interactionReply = await interaction.reply({
            content: "test",
            components: [this.createActionRowWithComponents(discordSelectMenu)]
        });
        return this.mapInteractionToInteractionEventAsync(interactionReply.interaction);
    }

    private async getUserInputByButtonsAsync(interaction: DiscordMessageInteraction, question: string, buttons: ActionButton[]): Promise<InteractionEvent> {
        const discordButtons = await Promise.all(buttons.map(button => this.mapButtonToDiscordButtonAsync(button)));
        const interactionReply = await interaction.reply({
            content: question,
            components: [this.createActionRowWithComponents(discordButtons)]
        });
        return this.mapInteractionToInteractionEventAsync(interactionReply.interaction);
    }
    // #endregion

    // #region Permission checks
    private checkUserHasPermission(user: DiscordGuildMember, permission: Permission): boolean {
        return user.permissions.has(this.mapPermissionToDiscordPermission(permission));
    }

    private checkUserHasPermissions(user: DiscordGuildMember, permissions: Permission[]): boolean {
        return permissions.every(permission => this.checkUserHasPermission(user, permission));
    }

    
    // #endregion
}

export default new DiscordService();