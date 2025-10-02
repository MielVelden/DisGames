import { Permission } from "../application/Permission";

export interface User {
    id: number | undefined;
    userId: string;
    username: string;
    displayName: string;
    bot: boolean;

    hasPermissions(permissions: Permission[]): boolean;
    hasPermission(permission: Permission): boolean;

    sendMessageAsync(message: string): Promise<void>;
}