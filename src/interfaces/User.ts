import { Permission } from "./Permission";

export interface User {
    id: string;
    username: string;
    displayName: string;
    bot: boolean;

    hasPermissions(permissions: Permission[]): boolean;
    hasPermission(permission: Permission): boolean;

    sendMessageAsync(message: string): Promise<void>;
}