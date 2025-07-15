import {
    Interaction as DiscordInteraction,
    User as DiscordUser,
    GuildMember as DiscordGuildMember,
    Guild as DiscordServer,
    Message as DiscordMessage} from 'discord.js';
import { 
    EventTypeEnum, 
    InteractionEvent
} from '../../../interfaces/application/Event';
import { User } from '../../../interfaces/domain/User';
import { ServersModel } from '../../../interfaces/database/TableInterfaces';
import ServerService from '../../ServerService';
import { getCommandConfig } from '../../../utils/Commands';
import { 
    SlashCommandDiscordEvent,
    MessageDiscordEvent,
    ButtonDiscordEvent,
    SelectMenuDiscordEvent
} from '../events';

class DiscordInteractionMapper {
    public async mapInteractionToInteractionEventAsync(interaction: DiscordInteraction): Promise<InteractionEvent> {
        const user = await this.mapDiscordUserToUser(interaction.user, interaction.member as DiscordGuildMember);
        const server = await this.mapDiscordServerToServerAsync(interaction.guild as DiscordServer);
        
        const baseParams = {
            user,
            server,
            channelId: interaction.channelId!,
            guildId: interaction.guildId!,
            messageId: interaction.id
        };

        if (interaction.isChatInputCommand()) {
            const command = getCommandConfig(interaction.commandName);
            return new SlashCommandDiscordEvent(
                interaction,
                baseParams.user,
                baseParams.server,
                baseParams.channelId,
                baseParams.guildId,
                baseParams.messageId,
                command
            );
        } 
        
        if (interaction.isButton()) {
            return new ButtonDiscordEvent(
                interaction,
                baseParams.user,
                baseParams.server,
                baseParams.channelId,
                baseParams.guildId,
                baseParams.messageId,
                interaction.customId
            );
        }
        
        if (interaction.isStringSelectMenu() || interaction.isChannelSelectMenu()) {
            return new SelectMenuDiscordEvent(
                interaction,
                baseParams.user,
                baseParams.server,
                baseParams.channelId,
                baseParams.guildId,
                baseParams.messageId,
                interaction.customId,
                interaction.values[0]
            );
        }
        
        throw new Error(`Unsupported interaction type: ${interaction.type}`);
    }

    public async mapMessageToInteractionEventAsync(message: DiscordMessage, eventType: EventTypeEnum): Promise<InteractionEvent> {
        const user = await this.mapDiscordUserToUser(message.author, message.member as DiscordGuildMember);
        const server = await this.mapDiscordServerToServerAsync(message.guild as DiscordServer);

        return new MessageDiscordEvent(
            message,
            user,
            server,
            message.channelId,
            message.guildId!,
            message.id,
            eventType,
            message.content
        );
    }

    private async mapDiscordUserToUser(user: DiscordUser, member: DiscordGuildMember): Promise<User> {
        const DiscordPermissionService = require("../DiscordPermissionService").default;
        const DiscordMessageHandler = require("../handlers/DiscordMessageHandler").default;
        
        return {
            id: user.id,
            username: user.username,
            displayName: user.displayName || user.username,
            bot: user.bot,
            hasPermissions: (permissions) => DiscordPermissionService.checkUserHasPermissions(member, permissions),
            hasPermission: (permission) => DiscordPermissionService.checkUserHasPermission(member, permission),
            sendMessageAsync: async (message: string) => await DiscordMessageHandler.sendMessageAsync(user, message),
        };
    }

    private async mapDiscordServerToServerAsync(server: DiscordServer): Promise<ServersModel> {
        return await ServerService.getServerAsync(server.id, true);
    }
}

export default new DiscordInteractionMapper();