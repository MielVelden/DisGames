import { User } from "../domain/User";
import { Component, BaseSelectMenu } from "./Message";
import { ServersModel, TimelineEntriesSaveModel } from "../database/TableInterfaces";
import {
    ButtonInteraction as DiscordButtonInteraction,
    ChatInputCommandInteraction as DiscordChatInputCommandInteraction,
    Guild as DiscordGuild,
    Message as DiscordMessage,
    ModalSubmitInteraction as DiscordModalSubmitInteraction,
    StringSelectMenuInteraction as DiscordStringSelectMenuInteraction
} from "discord.js";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { ModalDefinition, ModalResult, ModalTextField } from "./Modal";
import { Command } from "./Command";
import { Games_Settings, GameSettingsSchema, GameSettingsValues } from "../domain/GameSettings";
import { Duration } from "./Duration";
import { EventTypeEnum } from "../enums";

export interface TimelineEvent {
    user: User;
    server: ServersModel;
    timelineEntries: TimelineEntriesSaveModel[];
    addTimelineEntry(entry: TimelineEntriesSaveModel): void;
    commitTimelineAsync(): Promise<void>;
}

export interface GuildCreateEvent {
    guild: DiscordGuild;
    server: ServersModel;
    systemChannelId: string | null;
}

export interface BaseInteractionEvent {
    customId: string;

    components: Component[];
    addComponentAsync(component: Component): Promise<void>;
    addComponentsAsync(components: Component[], addInFront?: boolean): Promise<void>;
    clearComponentsAsync(): Promise<void>;

    sendToChannelAsync(channelId: string, components: Component[]): Promise<void>;
    editAsync(content?: string): Promise<void>;
    editWithComponentsAsync(components: Component[]): Promise<void>;

    getUserInputBySelectMenuAsync(selectMenu: BaseSelectMenu): Promise<SelectMenuInteractionEvent | null>;
    getUserInputByButtonsAsync(question: MultiLingualString, buttons: MultiLingualString[]): Promise<string | null>;
    getConfirmationFromUserAsync(container: Component[]): Promise<InteractionEvent | null>;
    askUserAsync<const TFields extends Record<string, ModalTextField>>(modal: ModalDefinition<TFields>): Promise<ModalResult<TFields> | null>;
    getSettingsContainer(settingsSchema: GameSettingsSchema, initialSettings?: GameSettingsValues): Promise<Games_Settings | null>;

    getChannelNameAsync(channelId: string): Promise<string>;

    user: User;
    server: ServersModel;

    messageId: string;
    channelId: string;
    guildId: string;

    timelineEntries: TimelineEntriesSaveModel[];
    addTimelineEntry(entry: TimelineEntriesSaveModel): void;
    commitTimelineAsync(): Promise<void>;

    scheduleAction(task: () => Promise<void>): void;
}

export interface ReplyInteractionEvent {
    replyAsync(content?: MultiLingualString, ephemeral?: boolean): Promise<void>;
}

export interface SlashCommandInteractionEvent extends BaseInteractionEvent, ReplyInteractionEvent {
    type: EventTypeEnum.SLASH_COMMAND;
    currentInteraction: DiscordChatInputCommandInteraction;

    command: Command;

    getOption(name: string): string | number | boolean | undefined;
    getOption<T>(name: string): T | undefined;
    handleCommandOptionsAsync(): Promise<void>;
    getFollowUpOption(key: string): string | number | boolean | undefined;
    setFollowUpOption(key: string, value: string | number | boolean): void;
    followUpOptions: Record<string, string | number | boolean>;
}

export interface MessageInteractionEvent extends BaseInteractionEvent, ReplyInteractionEvent {
    type: EventTypeEnum.MESSAGE | EventTypeEnum.MESSAGE_UPDATE | EventTypeEnum.MESSAGE_DELETE;
    currentInteraction: DiscordMessage;

    command?: Command;

    sendAsync(): Promise<void>;
    reactAsync(emoji: string): Promise<void>;

    messageDeleted: boolean;
    deleteAsync(): Promise<void>;
    content: string;
}

export interface ButtonInteractionEvent extends BaseInteractionEvent, ReplyInteractionEvent {
    type: EventTypeEnum.BUTTON;
    currentInteraction: DiscordButtonInteraction;
    
    sendAsync(): Promise<void>;
    reactAsync(emoji: string): Promise<void>;
    deleteAsync(): Promise<void>;
}

export interface SelectMenuInteractionEvent extends BaseInteractionEvent, ReplyInteractionEvent {
    type: EventTypeEnum.SELECT_MENU;
    currentInteraction: DiscordStringSelectMenuInteraction;

    selected: string;
    deferReplyAsync(): Promise<void>;
    sendAsync(): Promise<void>;
}

export interface ModalSubmitInteractionEvent extends BaseInteractionEvent, ReplyInteractionEvent {
    type: EventTypeEnum.MODAL_SUBMIT;
    currentInteraction: DiscordModalSubmitInteraction;

    getValue(key: string): string;
    deferReplyAsync(): Promise<void>;
}

export type InteractionEvent =
    | SlashCommandInteractionEvent
    | ButtonInteractionEvent
    | SelectMenuInteractionEvent
    | ModalSubmitInteractionEvent
    | MessageInteractionEvent;

export function isReplyInteractionEvent(event: InteractionEvent): event is SlashCommandInteractionEvent | ButtonInteractionEvent | SelectMenuInteractionEvent | ModalSubmitInteractionEvent | MessageInteractionEvent {
    switch (event.type) {
        case EventTypeEnum.SLASH_COMMAND:
        case EventTypeEnum.MESSAGE:
        case EventTypeEnum.MESSAGE_UPDATE:
        case EventTypeEnum.MESSAGE_DELETE:
        case EventTypeEnum.BUTTON:
        case EventTypeEnum.SELECT_MENU:
        case EventTypeEnum.MODAL_SUBMIT:
            return true;
        default:
            return false;
    }
}

export function isSlashCommandInteractionEvent(event: InteractionEvent): event is SlashCommandInteractionEvent {
    return event.type === EventTypeEnum.SLASH_COMMAND;
}

export function isMessageInteractionEvent(event: InteractionEvent): event is MessageInteractionEvent {
    return event.type === EventTypeEnum.MESSAGE || 
           event.type === EventTypeEnum.MESSAGE_UPDATE || 
           event.type === EventTypeEnum.MESSAGE_DELETE;
}

export function isButtonInteractionEvent(event: InteractionEvent): event is ButtonInteractionEvent {
    return event.type === EventTypeEnum.BUTTON;
}

export function isSelectMenuInteractionEvent(event: InteractionEvent): event is SelectMenuInteractionEvent {
    return event.type === EventTypeEnum.SELECT_MENU;
}

export function isModalSubmitInteractionEvent(event: InteractionEvent): event is ModalSubmitInteractionEvent {
    return event.type === EventTypeEnum.MODAL_SUBMIT;
}

export interface Handler {
    id: string;
    userId?: string;
    handle: (interaction: InteractionEvent) => Promise<void>;
    timeout?: Duration;
    onTimeout?: () => Promise<void>;
}

export interface HandlerConfig extends Omit<Handler, "id"> {
}

export interface ButtonHandler extends Handler {
}

export interface SelectMenuHandler extends Handler {
}

export interface ModalHandler extends Handler {
}
