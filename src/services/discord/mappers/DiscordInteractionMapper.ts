import {
    Interaction as DiscordInteraction,
    User as DiscordUser,
    GuildMember as DiscordGuildMember,
    Guild as DiscordServer,
    Message as DiscordMessage,
    StringSelectMenuInteraction as DiscordStringSelectMenuInteraction
} from 'discord.js';
import { InteractionEvent } from '../../../interfaces/application/Event';
import { User } from '../../../interfaces/domain/User';
import { ServersModel, UsersSaveModel } from '../../../interfaces/database/TableInterfaces';
import { getCommandConfig } from '../../../utils/collectors/CommandCollector';
import { getOrCreateServerAsync, getTempServer } from './DiscordServerMapper';
import {
    SlashCommandDiscordEvent,
    MessageDiscordEvent,
    ButtonDiscordEvent,
    SelectMenuDiscordEvent
} from '../events';
import DiscordPermissionService from '../DiscordPermissionService';
import DiscordMessageHandler from '../handlers/DiscordMessageHandler';
import UserService from '../../domain/UserService';
import { EventTypeEnum, ExceptionEnum, isMessageEventType } from '../../../interfaces/enums';
import { ErrorHelper } from '../../../utils/application/Error';
import Logger from '../../../utils/application/Logger';

class DiscordInteractionMapper {
    public async mapInteractionToInteractionEventAsync(interaction: DiscordInteraction): Promise<InteractionEvent> {
        const baseParams = {
            channelId: interaction.channelId!,
            guildId: interaction.guildId!,
            messageId: interaction.id
        };

        let event: InteractionEvent;

        if (interaction.isChatInputCommand()) {
            const command = getCommandConfig(interaction.commandName, "Slash");
            if (!command)
                throw new Error(`Command not found: ${interaction.commandName}`);

            const tempEvent = new SlashCommandDiscordEvent(
                interaction,
                await this.getTempUser(interaction.user, interaction.member as DiscordGuildMember),
                getTempServer(interaction.guild as DiscordServer),
                baseParams.channelId,
                baseParams.guildId,
                baseParams.messageId,
                command
            );

            const user = await this.mapDiscordUserToUser(interaction.user, interaction.member as DiscordGuildMember, tempEvent);
            const server = await this.mapDiscordServerToServerAsync(interaction.guild as DiscordServer, tempEvent);

            event = new SlashCommandDiscordEvent(
                interaction,
                user,
                server,
                baseParams.channelId,
                baseParams.guildId,
                baseParams.messageId,
                command
            );
        } else if (interaction.isButton()) {
            const tempEvent = new ButtonDiscordEvent(
                interaction,
                await this.getTempUser(interaction.user, interaction.member as DiscordGuildMember),
                getTempServer(interaction.guild as DiscordServer),
                baseParams.channelId,
                baseParams.guildId,
                baseParams.messageId,
                interaction.customId
            );

            const user = await this.mapDiscordUserToUser(interaction.user, interaction.member as DiscordGuildMember, tempEvent);
            const server = await this.mapDiscordServerToServerAsync(interaction.guild as DiscordServer, tempEvent);

            event = new ButtonDiscordEvent(
                interaction,
                user,
                server,
                baseParams.channelId,
                baseParams.guildId,
                baseParams.messageId,
                interaction.customId
            );
        } else if (interaction.isStringSelectMenu() || interaction.isChannelSelectMenu()) {
            const tempEvent = new SelectMenuDiscordEvent(
                interaction as DiscordStringSelectMenuInteraction,
                this.getTempUser(interaction.user, interaction.member as DiscordGuildMember),
                getTempServer(interaction.guild as DiscordServer),
                baseParams.channelId,
                baseParams.guildId,
                baseParams.messageId,
                interaction.customId,
                interaction.values[0]
            );

            const user = await this.mapDiscordUserToUser(interaction.user, interaction.member as DiscordGuildMember, tempEvent);
            const server = await this.mapDiscordServerToServerAsync(interaction.guild as DiscordServer, tempEvent);

            event = new SelectMenuDiscordEvent(
                interaction as DiscordStringSelectMenuInteraction,
                user,
                server,
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
        if (!isMessageEventType(eventType))
            ErrorHelper.throw(ExceptionEnum.METHOD_NOT_IMPLEMENTED);
        
        const command = getCommandConfig(message.content.split(' ')[0].toLowerCase(), "Message") ?? undefined;
        
        const tempEvent = new MessageDiscordEvent(
            message,
            this.getTempUser(message.author, message.member as DiscordGuildMember),
            getTempServer(message.guild as DiscordServer),
            message.channelId,
            message.guildId!,
            message.id,
            eventType,
            message.content,
            command
        );

        const user = await this.mapDiscordUserToUser(message.author, message.member as DiscordGuildMember, tempEvent);
        const server = await this.mapDiscordServerToServerAsync(message.guild as DiscordServer, tempEvent);

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

    private getTempUser(discordUser: DiscordUser, discordMember: DiscordGuildMember): User {
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
        let user = await UserService.getByExternalIdAsync(discordUser.id).catch((error: Error) => {
            Logger.logError('Failed to fetch user by external ID', error, { sendToDiscord: true });
            return undefined;
        });
        if (!user) {
            user = await UserService.saveAsync(new UsersSaveModel({
                UserId: discordUser.id,
                Username: discordUser.username,
            }), event).catch((error: Error) => {
                Logger.logError('Failed to save new user', error, { sendToDiscord: true });
                return undefined;
            });
            // Race condition: another request inserted first, fetch the existing record
            if (!user)
                user = await UserService.getByExternalIdAsync(discordUser.id);
        }

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


    private async mapDiscordServerToServerAsync(discordServer: DiscordServer, event: InteractionEvent): Promise<ServersModel> {
        return getOrCreateServerAsync(discordServer, event);
    }
}

export default new DiscordInteractionMapper();