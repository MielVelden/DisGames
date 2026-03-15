import { LanguageCommandOptionTranslations } from "./i18n";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { CommandEnum } from "../enums/commands/CommandEnum";
import { InteractionEvent, SlashCommandInteractionEvent } from "./Event";
import { SelectMenu } from "./Message";
import { Permission } from "../enums/application/Permission";

export interface Command {
    name: CommandEnum;
    description: MultiLingualString;
    
    isSlashCommand: boolean;
    isMessageCommand: boolean;

    permissions?: Permission[];
    options?: CommandOptionConfig<string | number>[];

    canExecute?: (event: InteractionEvent) => boolean;
    executeAsync(event: InteractionEvent): Promise<void>;
}

// #region Command Option
export interface CommandOptionConfig<T extends string | number> {
    key: LanguageCommandOptionTranslations<T>;
    type: CommandOptionType;
    required: boolean;
    choices: CommandOptionChoiceConfig<T>[];
}

export interface CommandOptionChoiceConfig<T extends string | number> {
    enumValue: T;
    followUps?: CommandOptionFollowUpConfig<string>[];
    permissions?: Permission[];
    validate?: (event: SlashCommandInteractionEvent) => Promise<boolean>;
    handler?: (event: SlashCommandInteractionEvent) => Promise<void>;
}

export enum CommandOptionFollowUpType {
    SELECT_MENU = 1,
}

export interface CommandOptionFollowUpConfig<TKey extends string = string> {
    type: CommandOptionFollowUpType;
    key: TKey;
    isRequiredAsync?: (event: SlashCommandInteractionEvent) => Promise<boolean>;
    configAsync(event: SlashCommandInteractionEvent): Promise<SelectMenu>;
    emptyReply?: MultiLingualString;
}

export interface CommandOption {
    name: MultiLingualString;
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
