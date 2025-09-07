import {
    Interaction as DiscordInteraction,
    User as DiscordUser,
    GuildMember as DiscordGuildMember,
    Guild as DiscordServer,
    Message as DiscordMessage
} from 'discord.js';
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
import DiscordPermissionService from '../DiscordPermissionService';
import DiscordMessageHandler from '../handlers/DiscordMessageHandler';
import UserService from '../../UserService';

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
            if (!command)
                throw new Error(`Command not found: ${interaction.commandName}`);

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

        const command = getCommandConfig(message.content.split(' ')[0].toLowerCase()) ?? undefined;

        return new MessageDiscordEvent(
            message,
            user,
            server,
            message.channelId,
            message.guildId!,
            message.id,
            eventType,
            message.content,
            command
        );
    }

    private async mapDiscordUserToUser(discordUser: DiscordUser, discordMember: DiscordGuildMember): Promise<User> {
        const user = await UserService.getByUserIdAsync(discordUser.id, true);

        // Update the username if it has changed
        if (discordUser.username !== user.Username)
            await UserService.updateUsernameAsync(discordUser.id, discordUser.username);

        return {
            id: user.Id!,
            userId: discordUser.id,
            username: discordUser.username,
            displayName: discordUser.displayName || discordUser.username,
            bot: discordUser.bot,
            hasPermissions: (permissions) => DiscordPermissionService.checkUserHasPermissions(discordMember, permissions),
            hasPermission: (permission) => DiscordPermissionService.checkUserHasPermission(discordMember, permission),
            sendMessageAsync: async (message: string) => await DiscordMessageHandler.sendMessageAsync(discordUser, message),
        };
    }

    private async mapDiscordServerToServerAsync(discordServer: DiscordServer): Promise<ServersModel> {
        const server = await ServerService.getServerAsync(discordServer.id, true);

        // Update the server name if it has changed
        if (discordServer.name !== server.Name)
            await ServerService.updateNameAsync(discordServer.id, discordServer.name);

        return server;
    }
}

export default new DiscordInteractionMapper();