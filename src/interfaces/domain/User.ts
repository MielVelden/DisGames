import { Permission } from "../application/Permission";
import { UserRoleEnum } from "../enums/domain/UserRoleEnum";

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