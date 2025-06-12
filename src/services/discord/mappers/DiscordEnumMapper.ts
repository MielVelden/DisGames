import {
    Interaction as DiscordInteraction,
    PermissionResolvable, PermissionsBitField,
    ButtonStyle as DiscordButtonStyle} from 'discord.js';
import { EventTypeEnum } from '../../../interfaces/application/Event';
import { Permission } from '../../../interfaces/application/Permission';
import { ButtonStyle, Component, ComponentType } from '../../../interfaces/application/Message';
import { DiscordComponentBuilder } from '../DiscordService';

class DiscordEnumMapper {
    public mapPermissionToDiscordPermission(permission: Permission): PermissionResolvable {
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

    public mapButtonStyleToDiscordButtonStyle(style: ButtonStyle): DiscordButtonStyle {
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

    public mapInteractionTypeToEventType(interaction: DiscordInteraction): EventTypeEnum {
        if (interaction.isChatInputCommand())
            return EventTypeEnum.SLASH_COMMAND;
        else if (interaction.isButton())
            return EventTypeEnum.BUTTON;
        else if (interaction.isStringSelectMenu())
            return EventTypeEnum.SELECT_MENU;
        else if (interaction.isModalSubmit())
            return EventTypeEnum.MODAL_SUBMIT;
        else
            throw new Error(`Unhandled interaction type: ${interaction.type}`);
    }

    public isActionRowComponent(component: Component): boolean {
        return component.type === ComponentType.BUTTON || 
            component.type === ComponentType.STRING_SELECT ||
            component.type === ComponentType.USER_SELECT || 
            component.type === ComponentType.ROLE_SELECT || 
            component.type === ComponentType.MENTIONABLE_SELECT || 
            component.type === ComponentType.CHANNEL_SELECT;
    }
}

export default new DiscordEnumMapper();