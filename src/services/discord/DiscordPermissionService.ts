import {
    GuildMember as DiscordGuildMember
} from 'discord.js';
import { Permission } from '../../interfaces/enums/application/Permission';
import DiscordEnumMapper from './mappers/DiscordEnumMapper';

class DiscordPermissionService {
    public checkUserHasPermission(user: DiscordGuildMember, permission: Permission): boolean {
        return user.permissions.has(DiscordEnumMapper.mapPermissionToDiscordPermission(permission));
    }

    public checkUserHasPermissions(user: DiscordGuildMember, permissions: Permission[]): boolean {
        return permissions.every(permission => this.checkUserHasPermission(user, permission));
    }
}

export default new DiscordPermissionService();