import {
    Interaction as DiscordInteraction,
    User as DiscordUser,
    GuildMember as DiscordGuildMember,
    Guild as DiscordServer,
    Message as DiscordMessage} from 'discord.js';
import { EventTypeEnum, InteractionEvent, MessageInteractionEvent, SelectMenuInteractionEvent, SlashCommandInteractionEvent } from '../../../interfaces/application/Event';
import { User } from '../../../interfaces/domain/User';
import { Permission } from '../../../interfaces/application/Permission';
import { SelectMenu } from '../../../interfaces/application/Message';
import {
    Component
} from '../../../interfaces/application/Message';
import { ServersModel } from '../../../interfaces/database/TableInterfaces';
import ServerService from '../../ServerService';
import { MultiLingualString } from '../../../utils/i18n/MultiLangualString';
import DiscordMessageHandler from '../handlers/DiscordMessageHandler';
import DiscordPermissionService from '../DiscordPermissionService';
import DiscordComponentMapper from './DiscordComponentMapper';
import DiscordEnumMapper from './DiscordEnumMapper';
import DiscordService from '../DiscordService';
import { getCommandConfig, handleCommandOptions } from '../../../utils/Commands';

class DiscordInteractionMapper {
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
            type: DiscordEnumMapper.mapInteractionTypeToEventType(interaction),
            customId: interaction.id,
            currentInteraction: interaction,
            user: user,
            channelId: interaction.channelId!,
            guildId: interaction.guildId!,
            messageId: interaction.id,
            server: server,

            components: [],
            addComponentAsync: async (component: Component) => await DiscordComponentMapper.addComponentAsync(event, component),
            addComponentsAsync: async (components: Component[]) => await DiscordComponentMapper.addComponentsAsync(event, components),
            clearComponentsAsync: async () => await DiscordComponentMapper.clearComponentsAsync(event),
            sendToChannelAsync: async (channelId: string, components: Component[]) => await DiscordMessageHandler.sendToChannelAsync(event, channelId, components),
            editAsync: async (content?: string) => await DiscordMessageHandler.editAsync(event, content),
            editWithComponentAsync: async (component: Component) => await DiscordMessageHandler.editWithComponentAsync(event, component),
            reactAsync: async (emoji: string) => { throw new Error("Not implemented yet"); },

            getUserInputByButtonsAsync: async (question: MultiLingualString, buttons: MultiLingualString[]) => await DiscordMessageHandler.getUserInputByButtonsAsync(event, question, buttons),
            getUserInputBySelectMenuAsync: async (selectMenu: SelectMenu) => { return DiscordMessageHandler.getUserInputBySelectMenuAsync(event, selectMenu) },
        } as InteractionEvent;

        if (interaction.isChatInputCommand()) {
            const command = getCommandConfig(interaction.commandName);
            const slashCommandEvent = {
                ...event,
                replyAsync: async (content?: MultiLingualString) => await DiscordMessageHandler.replyAsync(event, content),
                deleteAsync: async () => await DiscordMessageHandler.deleteAsync(event as MessageInteractionEvent),
                getOption: (name: string) => DiscordService.getOption(interaction, name),
                command: command,
                handleCommandOptionsAsync: async () => Promise.resolve(),

                getFollowUpOption: (key: string) => {
                    return slashCommandEvent.followUpOptions[key];
                },
                setFollowUpOption: (key: string, value: string | number | boolean) => {
                    slashCommandEvent.followUpOptions[key] = value;
                },
                followUpOptions: {},
            } as SlashCommandInteractionEvent;
            
            slashCommandEvent.handleCommandOptionsAsync = async () => await handleCommandOptions(slashCommandEvent);
            
            return slashCommandEvent;
        } else if (interaction.isButton()) {
            const buttonEvent = {
                ...event,
                customId: interaction.customId,
                reactAsync: async (emoji: string) => await DiscordMessageHandler.reactAsync(interaction, emoji),
                deleteAsync: async () => await DiscordMessageHandler.deleteAsync(event as MessageInteractionEvent),
                sendAsync: async (message: MultiLingualString | undefined) => await DiscordMessageHandler.sendAsync(event, message),
                replyAsync: async (content?: MultiLingualString) => await DiscordMessageHandler.replyAsync(event, content),
            } as MessageInteractionEvent;
            
            buttonEvent.deleteAsync = async () => await DiscordMessageHandler.deleteAsync(buttonEvent as MessageInteractionEvent);
            buttonEvent.replyAsync = async (content?: MultiLingualString) => await DiscordMessageHandler.replyAsync(buttonEvent, content);
            
            return buttonEvent;
        } else if (interaction.isStringSelectMenu() || interaction.isChannelSelectMenu()) {
            const selectMenuEvent = {
                ...event,
                customId: interaction.customId,
                replyAsync: async (content?: MultiLingualString) => await DiscordMessageHandler.replyAsync(event, content),
                selected: interaction.values[0],
                deferReplyAsync: async () => await DiscordMessageHandler.deferUpdateAsync(interaction),
                sendAsync: async (message: MultiLingualString | undefined) => await DiscordMessageHandler.sendAsync(event, message),
            } as SelectMenuInteractionEvent;
            
            selectMenuEvent.replyAsync = async (content?: MultiLingualString) => await DiscordMessageHandler.replyAsync(selectMenuEvent, content);
            
            return selectMenuEvent;
        } else {
            console.log("Unknown interaction type", interaction);
            throw new Error("Unknown interaction type");
        }

        return event;
    }

    public async mapMessageToInteractionEventAsync(interaction: DiscordMessage, eventType: EventTypeEnum): Promise<InteractionEvent> {
        const user = await this.mapDiscordUserToUser(interaction.author, interaction.member as DiscordGuildMember);
        const server = await this.mapDiscordServerToServer(interaction.guild as DiscordServer);
        // Create a base interaction event
        const event: InteractionEvent = {
            type: eventType,
            customId: interaction.id,
            currentInteraction: interaction,
            user: user,
            channelId: interaction.channelId!,
            guildId: interaction.guildId!,
            messageId: interaction.id,
            server: server,
            content: interaction.content,

            components: [],
            addComponentAsync: async (component: Component) => await DiscordComponentMapper.addComponentAsync(event, component),
            addComponentsAsync: async (components: Component[]) => await DiscordComponentMapper.addComponentsAsync(event, components),
            clearComponentsAsync: async () => await DiscordComponentMapper.clearComponentsAsync(event),
            sendToChannelAsync: async (channelId: string, components: Component[]) => await DiscordMessageHandler.sendToChannelAsync(event, channelId, components),
            editAsync: async (content?: string) => await DiscordMessageHandler.editAsync(event, content),
            editWithComponentAsync: async (component: Component) => await DiscordMessageHandler.editWithComponentAsync(event, component),
            sendAsync: async (message: MultiLingualString | undefined) => await DiscordMessageHandler.sendAsync(event, message),
            replyAsync: async (content?: MultiLingualString) => await DiscordMessageHandler.replyAsync(event, content),
            deleteAsync: async () => await DiscordMessageHandler.deleteAsync(event as MessageInteractionEvent),
            reactAsync: async (emoji: string) => await DiscordMessageHandler.reactAsync(interaction, emoji),

            getUserInputByButtonsAsync: async (question: MultiLingualString, buttons: MultiLingualString[]) => await DiscordMessageHandler.getUserInputByButtonsAsync(event, question, buttons),
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
            hasPermission: (permission: Permission) => DiscordPermissionService.checkUserHasPermission(member, permission),
            hasPermissions: (permissions: Permission[]) => DiscordPermissionService.checkUserHasPermissions(member, permissions),
            sendMessageAsync: async (message: string) => await DiscordMessageHandler.sendMessageAsync(user, message),
        } as User;
    }

    private async mapDiscordServerToServer(server: DiscordServer): Promise<ServersModel> {
        return ServerService.getServer(server.id, true);
    }
}

export default new DiscordInteractionMapper();