import { MultiLingualString } from "../../utils/i18n/MultiLangualString";
import { InteractionEvent } from "./Event";
import { Permission } from "./Permission";

export interface Command {
    name: string;
    description: MultiLingualString;
    
    isSlashCommand: boolean;
    isMessageCommand: boolean;

    permissions?: Permission[];
    options?: CommandOption[];

    executeAsync(interactionEvent: InteractionEvent): Promise<void>;
}

// #region Command Option

export interface CommandOption {
    name: string;
    description: MultiLingualString;
    type: CommandOptionType;
    required?: boolean;
    choices?: CommandOptionChoice[];
    options?: CommandOption[];
}

export interface CommandOptionChoice {
    name: MultiLingualString;
    value: string;
}

export enum CommandOptionType {
    SUB_COMMAND = 1,
    SUB_COMMAND_GROUP = 2,
    STRING = 3,
    INTEGER = 4,
}

// #endregion
