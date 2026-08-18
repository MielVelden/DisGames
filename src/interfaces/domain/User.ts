import { Permission } from "../enums/application/Permission";
import { UserRoleEnum } from "../enums/application/UserRoleEnum";

export interface User {
    id: number | undefined;
    userId: string;
    username: string;
    displayName: string;
    bot: boolean;
    role: UserRoleEnum;

    hasPermissions(permissions: Permission[]): boolean;
    hasPermission(permission: Permission): boolean;

    sendMessageAsync(message: string): Promise<void>;
}

export interface UserLevelData {
    currentLevel: number;
    xpNow: number;
    xpMax: number;
    progress: number;
}