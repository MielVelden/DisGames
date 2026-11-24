import {
    GuildMember as DiscordGuildMember,
    PermissionsBitField
} from 'discord.js';
import { Permission } from '../../interfaces/enums/application/Permission';
import DiscordEnumMapper from './mappers/DiscordEnumMapper';
import Logger from '../../utils/application/Logger';

class DiscordPermissionService {
    public checkUserHasPermission(user: DiscordGuildMember, permission: Permission): boolean {
        const hasPermission = user.permissions.has(DiscordEnumMapper.mapPermissionToDiscordPermission(permission));
        if (!hasPermission)
            Logger.logWarning(`User ${user.id} missing permission ${permission}`);
        return hasPermission;
    }

    public checkUserHasPermissions(user: DiscordGuildMember, permissions: Permission[]): boolean {
        const hasAllPermissions = permissions.every(permission => this.checkUserHasPermission(user, permission));
        if (!hasAllPermissions)
            Logger.logWarning(`User ${user.id} missing one or more permissions: ${permissions.join(", ")}`);
        return hasAllPermissions;
    }

    public toPermissionInteger(permissions: Permission[]): number {
        const bits = permissions.map(permission => DiscordEnumMapper.mapPermissionToDiscordPermission(permission));
        return Number(PermissionsBitField.resolve(bits));
    }
}

export default new DiscordPermissionService();