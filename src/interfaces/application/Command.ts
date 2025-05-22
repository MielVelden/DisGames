import { InteractionEvent } from "./Event";
import { Permission } from "./Permission";

export interface Command {
    name: string;
    description: string;
    
    isSlashCommand: boolean;
    isMessageCommand: boolean;

    permissions?: Permission[];
    options?: CommandOption[];

    executeAsync(interactionEvent: InteractionEvent): Promise<void>;
}

// #region Command Option

export interface CommandOption {
    name: string;
    description: string;
    type: CommandOptionType;
    required?: boolean;
    choices?: CommandOptionChoice[];
    options?: CommandOption[];
}

export interface CommandOptionChoice {
    name: string;
    value: string;
}

export enum CommandOptionType {
    SUB_COMMAND = 1,
    SUB_COMMAND_GROUP = 2,
    STRING = 3,
    INTEGER = 4,
}

// #endregion
