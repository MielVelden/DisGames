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
import DiscordMessageHandler from '../mappers/DiscordMessageHandler';
import DiscordPermissionService from '../DiscordPermissionService';
import DiscordComponentMapper from '../handlers/DiscordComponentMapper';
import DiscordEnumMapper from './DiscordEnumMapper';
import DiscordService from '../DiscordService';

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
            editAsync: async (content?: string) => await DiscordMessageHandler.editAsync(event, content || ""),
            editWithComponentAsync: async (component: Component) => await DiscordMessageHandler.editWithComponentAsync(event, component),
            reactAsync: async (emoji: string) => { throw new Error("Not implemented yet"); },

            getUserInputByButtonsAsync: async (question: MultiLingualString, buttons: MultiLingualString[]) => await DiscordMessageHandler.getUserInputByButtonsAsync(event, question, buttons),
            getUserInputBySelectMenuAsync: async (selectMenu: SelectMenu) => { return DiscordMessageHandler.getUserInputBySelectMenuAsync(event, selectMenu) },
        } as InteractionEvent;

        if (interaction.isChatInputCommand()) {
            return {
                ...event,
                replyAsync: async (content?: MultiLingualString) => await DiscordMessageHandler.replyAsync(event, content),
                deleteAsync: async () => await DiscordMessageHandler.deleteAsync(interaction),
                getOption: (name: string) => DiscordService.getOption(interaction, name),
                commandName: interaction.commandName,
            } as SlashCommandInteractionEvent;
        } else if (interaction.isButton()) {
            return {
                ...event,
                customId: interaction.customId,
                reactAsync: async (emoji: string) => await DiscordMessageHandler.reactAsync(interaction, emoji),
                deleteAsync: async () => await DiscordMessageHandler.deleteAsync(interaction),
                sendAsync: async (message: MultiLingualString | undefined) => await DiscordMessageHandler.sendAsync(event, message),
            } as MessageInteractionEvent;
        } else if (interaction.isStringSelectMenu()) {
            return {
                ...event,
                customId: interaction.customId,
                replyAsync: async (content?: MultiLingualString) => await DiscordMessageHandler.replyAsync(event, content),
                selected: interaction.values[0],
                deferReplyAsync: async () => await DiscordMessageHandler.deferUpdateAsync(interaction),
                sendAsync: async (message: MultiLingualString | undefined) => await DiscordMessageHandler.sendAsync(event, message),
            } as SelectMenuInteractionEvent;
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
            editAsync: async (content?: string) => await DiscordMessageHandler.editAsync(event, content || ""),
            editWithComponentAsync: async (component: Component) => await DiscordMessageHandler.editWithComponentAsync(event, component),
            sendAsync: async (message: MultiLingualString | undefined) => await DiscordMessageHandler.sendAsync(event, message),
            replyAsync: async (content?: MultiLingualString) => await DiscordMessageHandler.replyAsync(event, content),
            deleteAsync: async () => await DiscordMessageHandler.deleteAsync(interaction),
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