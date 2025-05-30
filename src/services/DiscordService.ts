import {
    Interaction as DiscordInteraction,
    User as DiscordUser,
    GuildMember as DiscordGuildMember,
    PermissionResolvable, PermissionsBitField,
    ChatInputCommandInteraction as DiscordChatInputCommandInteraction,
    ButtonInteraction as DiscordButtonInteraction,
    MessageComponentInteraction as DiscordMessageComponentInteraction,
    StringSelectMenuBuilder as DiscordStringSelectMenuBuilder,
    UserSelectMenuBuilder as DiscordUserSelectMenuBuilder,
    RoleSelectMenuBuilder as DiscordRoleSelectMenuBuilder,
    MentionableSelectMenuBuilder as DiscordMentionableSelectMenuBuilder,
    ChannelSelectMenuBuilder as DiscordChannelSelectMenuBuilder,
    ButtonBuilder as DiscordButtonBuilder,
    ButtonStyle as DiscordButtonStyle,
    ActionRowBuilder as DiscordActionRowBuilder,
    Guild as DiscordServer,
    Message as DiscordMessage,
    StringSelectMenuInteraction as DiscordStringSelectMenuInteraction
} from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { EventType, InteractionEvent, MessageInteractionEvent, SelectMenuInteractionEvent, SlashCommandInteractionEvent } from '../interfaces/application/Event';
import { User } from '../interfaces/domain/User';
import { Permission } from '../interfaces/application/Permission';
import { ActionButton, ButtonStyle, ComponentType, SelectMenu, TextDisplay } from '../interfaces/application/Message';
import {
    StringSelect,
    UserSelect,
    RoleSelect,
    MentionableSelect,
    ChannelSelect,
    Component
} from '../interfaces/application/Message';
import { Command, CommandOptionType } from '../interfaces/application/Command';
import ComponentService from './ComponentService';
import { ServersModel } from '../interfaces/database/TableInterfaces';
import ServerService from './ServerService';

type DiscordMessageInteraction = DiscordButtonInteraction | DiscordMessageComponentInteraction;
type DiscordSelectMenuBuilder = DiscordStringSelectMenuBuilder | DiscordUserSelectMenuBuilder | DiscordRoleSelectMenuBuilder | DiscordMentionableSelectMenuBuilder | DiscordChannelSelectMenuBuilder;
type DiscordComponentBuilder = DiscordButtonBuilder | DiscordSelectMenuBuilder;

class DiscordService {
    // #region Command Mapping
    public mapCommandToSlashCommandBuilder(command: Command): SlashCommandBuilder {
        const builder = new SlashCommandBuilder()
            .setName(command.name)
            .setDescription(command.description);

        if (command.options) {
            for (const option of command.options) {
                switch (option.type) {
                    case CommandOptionType.STRING:
                        builder.addStringOption(stringOption => {
                            stringOption
                                .setName(option.name)
                                .setDescription(option.description)
                                .setRequired(option.required || false);

                            if (option.choices && option.choices.length > 0) {
                                stringOption.addChoices(...option.choices);
                            }

                            return stringOption;
                        });
                        break;
                    case CommandOptionType.INTEGER:
                        builder.addIntegerOption(intOption => {
                            intOption
                                .setName(option.name)
                                .setDescription(option.description)
                                .setRequired(option.required || false);

                            if (option.choices && option.choices.length > 0) {
                                intOption.addChoices(...option.choices.map(choice => ({
                                    name: choice.name,
                                    value: parseInt(choice.value)
                                })));
                            }

                            return intOption;
                        });
                        break;
                    case CommandOptionType.SUB_COMMAND:
                        builder.addSubcommand(subCommand => {
                            subCommand
                                .setName(option.name)
                                .setDescription(option.description);

                            if (option.options) {
                                for (const subOption of option.options) {
                                    // Recursively handle sub-options
                                    this.addOptionToBuilder(subCommand, subOption);
                                }
                            }

                            return subCommand;
                        });
                        break;
                    case CommandOptionType.SUB_COMMAND_GROUP:
                        builder.addSubcommandGroup(subGroup => {
                            subGroup
                                .setName(option.name)
                                .setDescription(option.description);

                            if (option.options) {
                                for (const subOption of option.options) {
                                    if (subOption.type === CommandOptionType.SUB_COMMAND) {
                                        subGroup.addSubcommand(subCommand => {
                                            subCommand
                                                .setName(subOption.name)
                                                .setDescription(subOption.description);

                                            if (subOption.options) {
                                                for (const subSubOption of subOption.options) {
                                                    this.addOptionToBuilder(subCommand, subSubOption);
                                                }
                                            }

                                            return subCommand;
                                        });
                                    }
                                }
                            }

                            return subGroup;
                        });
                        break;
                }
            }
        }

        return builder;
    }

    private addOptionToBuilder(builder: any, option: any): void {
        switch (option.type) {
            case CommandOptionType.STRING:
                builder.addStringOption((stringOption: any) => {
                    stringOption
                        .setName(option.name)
                        .setDescription(option.description)
                        .setRequired(option.required || false);

                    if (option.choices && option.choices.length > 0) {
                        stringOption.addChoices(...option.choices);
                    }

                    return stringOption;
                });
                break;
            case CommandOptionType.INTEGER:
                builder.addIntegerOption((intOption: any) => {
                    intOption
                        .setName(option.name)
                        .setDescription(option.description)
                        .setRequired(option.required || false);

                    if (option.choices && option.choices.length > 0) {
                        intOption.addChoices(...option.choices.map((choice: any) => ({
                            name: choice.name,
                            value: parseInt(choice.value)
                        })));
                    }

                    return intOption;
                });
                break;
        }
    }

    // #endregion

    // #region Mappers
    public async mapInteractionToInteractionEventAsync(interaction: DiscordInteraction): Promise<InteractionEvent> {
        const user = await this.mapDiscordUserToUser(interaction.user, interaction.member as DiscordGuildMember);
        const server = await this.mapDiscordServerToServer(interaction.guild as DiscordServer);

        console.log("interaction.isMessageComponent()", interaction.isMessageComponent());
        console.log("interaction.isAutocomplete()", interaction.isAutocomplete());
        console.log("interaction.isButton()", interaction.isButton());
        console.log("interaction.isStringSelectMenu()", interaction.isStringSelectMenu());
        console.log("interaction.isUserSelectMenu()", interaction.isUserSelectMenu());
        console.log("interaction.isRoleSelectMenu()", interaction.isRoleSelectMenu());
        console.log("interaction.isMentionableSelectMenu()", interaction.isMentionableSelectMenu());
        console.log("interaction.isChannelSelectMenu()", interaction.isChannelSelectMenu());
        console.log("interaction.isModalSubmit()", interaction.isModalSubmit());
        console.log("interaction.isMessageContextMenuCommand()", interaction.isMessageContextMenuCommand());

        if (interaction.isMessageContextMenuCommand())
            throw new Error("Not implemented yet");

        // Create a base interaction event
        const event: InteractionEvent = {
            type: this.mapInteractionTypeToEventType(interaction),
            customId: interaction.id,
            currentInteraction: interaction,
            user: user,
            channelId: interaction.channelId!,
            guildId: interaction.guildId!,
            messageId: interaction.id,
            server: server,

            components: [],
            addComponentAsync: async (component: Component) => await this.addComponentAsync(event, component),
            addComponentsAsync: async (components: Component[]) => await this.addComponentsAsync(event, components),
            clearComponentsAsync: async () => await this.clearComponentsAsync(event),
            editAsync: async (content?: string) => await this.editAsync(event, content || ""),
            reactAsync: async (emoji: string) => { throw new Error("Not implemented yet"); },

            getUserInputByButtonsAsync: async (question: string, buttons: string[]) => await this.getUserInputByButtonsAsync(event, question, buttons),
            getUserInputBySelectMenuAsync: async (selectMenu: SelectMenu) => { return this.getUserInputBySelectMenuAsync(event, selectMenu) },
        } as InteractionEvent;

        if (interaction.isChatInputCommand()) {
            return {
                ...event,
                replyAsync: async (content?: string) => await this.replyAsync(event, content || ""),
                deleteAsync: async () => await this.deleteAsync(interaction),
                getOption: (name: string) => this.getOption(interaction, name),
                commandName: interaction.commandName,
            } as SlashCommandInteractionEvent;
        } else if (interaction.isButton()) {
            return {
                ...event,
                customId: interaction.customId,
                reactAsync: async (emoji: string) => await this.reactAsync(interaction, emoji),
                deleteAsync: async () => await this.deleteAsync(interaction),
            } as MessageInteractionEvent;
        } else if (interaction.isStringSelectMenu()) {
            return {
                ...event,
                customId: interaction.customId,
                replyAsync: async (content?: string) => await this.replyAsync(event, content || ""),
                selected: interaction.values[0],
            } as SelectMenuInteractionEvent;
        } else {
            console.log("Unknown interaction type", interaction);
            throw new Error("Unknown interaction type");
        }

        return event;
    }

    public async mapMessageToInteractionEventAsync(interaction: DiscordMessage): Promise<InteractionEvent> {
        const user = await this.mapDiscordUserToUser(interaction.author, interaction.member as DiscordGuildMember);
        const server = await this.mapDiscordServerToServer(interaction.guild as DiscordServer);

        // Create a base interaction event
        const event: InteractionEvent = {
            type: EventType.MESSAGE,
            customId: interaction.id,
            currentInteraction: interaction,
            user: user,
            channelId: interaction.channelId!,
            guildId: interaction.guildId!,
            messageId: interaction.id,
            server: server,
            content: interaction.content,

            components: [],
            addComponentAsync: async (component: Component) => await this.addComponentAsync(event, component),
            addComponentsAsync: async (components: Component[]) => await this.addComponentsAsync(event, components),
            clearComponentsAsync: async () => await this.clearComponentsAsync(event),
            editAsync: async (content?: string) => await this.editAsync(event, content || ""),
            replyAsync: async (content?: string) => await this.replyAsync(event, content || ""),
            deleteAsync: async () => await this.deleteAsync(interaction),
            reactAsync: async (emoji: string) => await this.reactAsync(interaction, emoji),

            getUserInputByButtonsAsync: async (question: string, buttons: string[]) => await this.getUserInputByButtonsAsync(event, question, buttons),
            getUserInputBySelectMenuAsync: async (selectMenu: any) => { throw new Error("Not implemented yet"); },
        } as InteractionEvent;

        return event;
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

    private async mapDiscordServerToServer(server: DiscordServer): Promise<ServersModel> {
        return ServerService.getServer(server.id, true);
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

    private async mapTextDisplayToDiscordTextDisplayAsync(textDisplay: TextDisplay): Promise<DiscordButtonBuilder> {
        return new DiscordButtonBuilder()
            .setCustomId('text_display_' + Date.now())
            .setLabel(textDisplay.content || "Empty Text Display")
            .setStyle(DiscordButtonStyle.Secondary)
            .setDisabled(true);
    }

    private async mapComponentToDiscordComponent(component: Component): Promise<DiscordComponentBuilder> {
        switch (component.type) {
            case ComponentType.BUTTON:
                return await this.mapButtonToDiscordButtonAsync(component as ActionButton);
            case ComponentType.TEXT_DISPLAY:
                return await this.mapTextDisplayToDiscordTextDisplayAsync(component as TextDisplay);
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

    private async mapActionRowComponents(interaction: InteractionEvent): Promise<DiscordActionRowBuilder<any>> {
        const components = await Promise.all(interaction.components.map(component => this.mapComponentToDiscordComponent(component)));
        return this.createActionRowWithComponents(components);
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

    private mapInteractionTypeToEventType(interaction: DiscordInteraction): EventType {
        if (interaction.isChatInputCommand())
            return EventType.SLASH_COMMAND;
        else if (interaction.isButton())
            return EventType.BUTTON;
        else if (interaction.isStringSelectMenu())
            return EventType.SELECT_MENU;
        else if (interaction.isModalSubmit())
            return EventType.MODAL_SUBMIT;
        else
            throw new Error(`Unhandled interaction type: ${interaction.type}`);
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

    private async replyAsync(event: InteractionEvent, message: string): Promise<void> {
        const components = await this.mapActionRowComponents(event);
        const content = {
            content: message,
            components: [components]
        };

        if (event.currentInteraction instanceof DiscordChatInputCommandInteraction) {
            if (event.currentInteraction.replied)
                await event.currentInteraction.editReply(content);
            else
                await event.currentInteraction.reply(content);
        } else if (event.currentInteraction instanceof DiscordMessage) {
            if (event.currentInteraction.resolved)
                await event.currentInteraction.edit(content);
            else
                await event.currentInteraction.reply(content);
        } else if (event.currentInteraction instanceof DiscordButtonInteraction) {
            await event.currentInteraction.update(content);
        } else if (event.currentInteraction instanceof DiscordStringSelectMenuInteraction) {
            await event.currentInteraction.update(content);
        } else {
            throw new Error("Not implemented yet");
        }
    }

    private async editAsync(event: InteractionEvent, message: string): Promise<void> {
        const components = await this.mapActionRowComponents(event);
        const content = {
            content: message,
            components: [components]
        };

        if (event.currentInteraction instanceof DiscordChatInputCommandInteraction) {
            await event.currentInteraction.editReply(content);
        } else if (event.currentInteraction instanceof DiscordMessage) {
            await event.currentInteraction.edit(content);
        } else if (event.currentInteraction instanceof DiscordButtonInteraction) {
            await event.currentInteraction.update(content);
        } else if (event.currentInteraction instanceof DiscordStringSelectMenuInteraction) {
            await event.currentInteraction.update(content);
        } else {
            throw new Error("Not implemented yet");
        }
    }

    private async deleteAsync(interaction: DiscordChatInputCommandInteraction | DiscordButtonInteraction | DiscordMessage): Promise<void> {
        if (interaction instanceof DiscordMessage)
            await interaction.delete();
        else
            await interaction.deleteReply();
    }

    private async reactAsync(interaction: DiscordMessageInteraction | DiscordMessage, emoji: string): Promise<void> {
        if (interaction instanceof DiscordMessage)
            await interaction.react(emoji);
        else
            await interaction.message.react(emoji);
    }

    private async getUserInputBySelectMenuAsync(event: InteractionEvent, selectMenu: SelectMenu): Promise<InteractionEvent | null> {
        return new Promise(async (resolve) => {
            const selectMenuHandler = ComponentService.createSelectMenu(selectMenu, {
                userId: event.user.id,
                onTimeout: async () => {
                    resolve(null);
                },
                handle: async (e: InteractionEvent) => {
                    resolve(e);
                }
            });
            const discordSelectMenu = await this.mapSelectMenuToDiscordSelectMenuAsync(selectMenuHandler);
            if (event.currentInteraction instanceof DiscordChatInputCommandInteraction) {
                await event.currentInteraction.reply({
                    content: "test",
                    components: [this.createActionRowWithComponents(discordSelectMenu)]
                });
            } else if (event.currentInteraction instanceof DiscordMessage) {
                await event.currentInteraction.reply({
                    content: "test",
                    components: [this.createActionRowWithComponents(discordSelectMenu)]
                });
            } else {
                throw new Error("Not implemented yet");
            }
        });
    }

    private async getUserInputByButtonsAsync(event: InteractionEvent, question: string, buttons: string[]): Promise<string | null> {
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
                        resolve(btn.label ?? null);
                    }
                })
                return this.mapButtonToDiscordButtonAsync(btn);
            }));

            if (event.currentInteraction instanceof DiscordChatInputCommandInteraction) {
                await event.currentInteraction.reply({
                    content: question,
                    components: [this.createActionRowWithComponents(discordButtons)]
                });
            } else if (event.currentInteraction instanceof DiscordMessage) {
                await event.currentInteraction.reply({
                    content: question,
                    components: [this.createActionRowWithComponents(discordButtons)]
                });
            } else {
                throw new Error("Not implemented yet");
            }
        });
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

    // #region Component handling
    private async addComponentAsync(event: InteractionEvent, component: Component): Promise<void> {
        event.components.push(component);
    }

    private async addComponentsAsync(event: InteractionEvent, components: Component[]): Promise<void> {
        components.forEach(component => this.addComponentAsync(event, component));
    }

    private async clearComponentsAsync(event: InteractionEvent): Promise<void> {
        event.components = [];
    }
    // #endregion
}

export default new DiscordService();