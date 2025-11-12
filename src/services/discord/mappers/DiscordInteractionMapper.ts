import {
    Interaction as DiscordInteraction,
    User as DiscordUser,
    GuildMember as DiscordGuildMember,
    Guild as DiscordServer,
    Message as DiscordMessage
} from 'discord.js';
import { InteractionEvent } from '../../../interfaces/application/Event';
import { User } from '../../../interfaces/domain/User';
import { ServersModel } from '../../../interfaces/database/TableInterfaces';
import ServerService from '../../domain/ServerService';
import { getCommandConfig } from '../../../utils/collectors/CommandCollector';
import {
    SlashCommandDiscordEvent,
    MessageDiscordEvent,
    ButtonDiscordEvent,
    SelectMenuDiscordEvent
} from '../events';
import DiscordPermissionService from '../DiscordPermissionService';
import DiscordMessageHandler from '../handlers/DiscordMessageHandler';
import UserService from '../../domain/UserService';
import { EventTypeEnum } from '../../../interfaces/enums';

class DiscordInteractionMapper {
    public async mapInteractionToInteractionEventAsync(interaction: DiscordInteraction): Promise<InteractionEvent> {
        const server = await this.mapDiscordServerToServerAsync(interaction.guild as DiscordServer);

        const baseParams = {
            server,
            channelId: interaction.channelId!,
            guildId: interaction.guildId!,
            messageId: interaction.id
        };

        let event: InteractionEvent;

        if (interaction.isChatInputCommand()) {
            const command = getCommandConfig(interaction.commandName);
            if (!command)
                throw new Error(`Command not found: ${interaction.commandName}`);

            const tempEvent = new SlashCommandDiscordEvent(
                interaction,
                await this.getTempUser(interaction.user, interaction.member as DiscordGuildMember),
                baseParams.server,
                baseParams.channelId,
                baseParams.guildId,
                baseParams.messageId,
                command
            );

            const user = await this.mapDiscordUserToUser(interaction.user, interaction.member as DiscordGuildMember, tempEvent);

            event = new SlashCommandDiscordEvent(
                interaction,
                user,
                baseParams.server,
                baseParams.channelId,
                baseParams.guildId,
                baseParams.messageId,
                command
            );
        } else if (interaction.isButton()) {
            const tempEvent = new ButtonDiscordEvent(
                interaction,
                await this.getTempUser(interaction.user, interaction.member as DiscordGuildMember),
                baseParams.server,
                baseParams.channelId,
                baseParams.guildId,
                baseParams.messageId,
                interaction.customId
            );

            const user = await this.mapDiscordUserToUser(interaction.user, interaction.member as DiscordGuildMember, tempEvent);

            event = new ButtonDiscordEvent(
                interaction,
                user,
                baseParams.server,
                baseParams.channelId,
                baseParams.guildId,
                baseParams.messageId,
                interaction.customId
            );
        } else if (interaction.isStringSelectMenu() || interaction.isChannelSelectMenu()) {
            const tempEvent = new SelectMenuDiscordEvent(
                interaction,
                await this.getTempUser(interaction.user, interaction.member as DiscordGuildMember),
                baseParams.server,
                baseParams.channelId,
                baseParams.guildId,
                baseParams.messageId,
                interaction.customId,
                interaction.values[0]
            );

            const user = await this.mapDiscordUserToUser(interaction.user, interaction.member as DiscordGuildMember, tempEvent);

            event = new SelectMenuDiscordEvent(
                interaction,
                user,
                baseParams.server,
                baseParams.channelId,
                baseParams.guildId,
                baseParams.messageId,
                interaction.customId,
                interaction.values[0]
            );
        } else {
            throw new Error(`Unsupported interaction type: ${interaction.type}`);
        }

        return event;
    }

    public async mapMessageToInteractionEventAsync(message: DiscordMessage, eventType: EventTypeEnum): Promise<InteractionEvent> {
        const server = await this.mapDiscordServerToServerAsync(message.guild as DiscordServer);
        const command = getCommandConfig(message.content.split(' ')[0].toLowerCase()) ?? undefined;

        const tempEvent = new MessageDiscordEvent(
            message,
            await this.getTempUser(message.author, message.member as DiscordGuildMember),
            server,
            message.channelId,
            message.guildId!,
            message.id,
            eventType,
            message.content,
            command
        );

        const user = await this.mapDiscordUserToUser(message.author, message.member as DiscordGuildMember, tempEvent);

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

    private async getTempUser(discordUser: DiscordUser, discordMember: DiscordGuildMember): Promise<User> {
        return {
            id: undefined,
            userId: discordUser.id,
            username: discordUser.username,
            displayName: discordUser.displayName || discordUser.username,
            bot: discordUser.bot,
            role: undefined as any,
            hasPermissions: (permissions) => DiscordPermissionService.checkUserHasPermissions(discordMember, permissions),
            hasPermission: (permission) => DiscordPermissionService.checkUserHasPermission(discordMember, permission),
            sendMessageAsync: async (message: string) => await DiscordMessageHandler.sendMessageAsync(discordUser, message),
        };
    }

    private async mapDiscordUserToUser(discordUser: DiscordUser, discordMember: DiscordGuildMember, event: InteractionEvent): Promise<User> {
        let user = await UserService.getByUserIdAsync(discordUser.id, false);
        if (!user)
            user = await UserService.saveAsync({
                UserId: discordUser.id,
                Username: discordUser.username,
            }, event);

        // Update the username if it has changed
        if (discordUser.username !== user.Username)
            await UserService.updateUsernameAsync(discordUser.id, discordUser.username);

        return {
            id: user.Id!,
            userId: discordUser.id,
            username: discordUser.username,
            displayName: discordUser.displayName || discordUser.username,
            bot: discordUser.bot,
            role: user.UserRoleEnum,
            hasPermissions: (permissions) => DiscordPermissionService.checkUserHasPermissions(discordMember, permissions),
            hasPermission: (permission) => DiscordPermissionService.checkUserHasPermission(discordMember, permission),
            sendMessageAsync: async (message: string) => await DiscordMessageHandler.sendMessageAsync(discordUser, message),
        };
    }

    private async mapDiscordServerToServerAsync(discordServer: DiscordServer): Promise<ServersModel> {
        const server = await ServerService.getByServerIdAsync(discordServer.id, true);

        // Update the server name if it has changed
        if (discordServer.name !== server.Name)
            await ServerService.updateNameAsync(discordServer.id, discordServer.name);

        return server;
    }
}

export default new DiscordInteractionMapper();