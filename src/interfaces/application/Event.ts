import { User } from "../domain/User";
import { Component, BaseSelectMenu } from "./Message";
import { ServersModel, TimelineEntriesSaveModel } from "../database/TableInterfaces";
import {
    ButtonInteraction as DiscordButtonInteraction,
    ChatInputCommandInteraction as DiscordChatInputCommandInteraction,
    Interaction as DiscordInteraction, Message as DiscordMessage,
    StringSelectMenuInteraction as DiscordStringSelectMenuInteraction
} from "discord.js";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { Command } from "./Command";
import { Games_Settings, GameSettingsSchema, GameSettingsValues } from "../domain/GameSettings";
import { Duration } from "./Duration";
import { EventTypeEnum } from "../enums";

export interface InteractionEvent {
    // Event type and identifiers
    type: EventTypeEnum;
    customId: string;

    // Discord interaction or message object
    currentInteraction: DiscordInteraction | DiscordMessage;

    // Component management
    components: Component[];
    addComponentAsync(component: Component): Promise<void>;
    addComponentsAsync(components: Component[]): Promise<void>;
    clearComponentsAsync(): Promise<void>;

    // Message and component editing/sending
    sendToChannelAsync(channelId: string, components: Component[]): Promise<void>;
    editAsync(content?: string): Promise<void>;
    editWithComponentAsync(component: Component): Promise<void>;

    // User input and interaction
    getUserInputBySelectMenuAsync(selectMenu: BaseSelectMenu): Promise<SelectMenuInteractionEvent | null>;
    getUserInputByButtonsAsync(question: MultiLingualString, buttons: MultiLingualString[]): Promise<string | null>;
    getConfirmationFromUser(container: Component): Promise<InteractionEvent | null>;
    getSettingsContainer(settingsSchema: GameSettingsSchema, initialSettings?: GameSettingsValues): Promise<Games_Settings | null>;

    // Channel utilities
    getChannelNameAsync(channelId: string): Promise<string>;

    // User and server context
    user: User;
    server: ServersModel;

    // Message and channel identifiers
    messageId: string;
    channelId: string;
    guildId: string;

    // Timeline tracking
    timelineEntries: TimelineEntriesSaveModel[];
    addTimelineEntry(entry: TimelineEntriesSaveModel): void;
    commitTimelineAsync(): Promise<void>;
}

export interface ReplyInteractionEvent extends InteractionEvent {
    replyAsync(content?: MultiLingualString): Promise<void>;
}

export function isReplyInteractionEvent(event: InteractionEvent): event is ReplyInteractionEvent {
    return (
        event.type === EventTypeEnum.SLASH_COMMAND ||
        event.type === EventTypeEnum.MESSAGE ||
        event.type === EventTypeEnum.BUTTON ||
        event.type === EventTypeEnum.SELECT_MENU
    );
}


export interface SlashCommandInteractionEvent extends InteractionEvent, ReplyInteractionEvent {
    currentInteraction: DiscordChatInputCommandInteraction;

    command: Command;

    getOption(name: string): string | number | boolean | undefined;
    getOption<T>(name: string): T | undefined;
    handleCommandOptionsAsync(): Promise<void>;
    getFollowUpOption(key: string): string | number | boolean | undefined;
    setFollowUpOption(key: string, value: string | number | boolean): void;
    followUpOptions: Record<string, string | number | boolean>;
}

export function isSlashCommandInteractionEvent(event: InteractionEvent): event is SlashCommandInteractionEvent {
    return event.type === EventTypeEnum.SLASH_COMMAND;
}

export interface MessageInteractionEvent extends InteractionEvent, ReplyInteractionEvent {
    currentInteraction: DiscordMessage;

    command?: Command;

    sendAsync(): Promise<void>;
    reactAsync(emoji: string): Promise<void>;

    messageDeleted: boolean;
    deleteAsync(): Promise<void>;
    content: string;
}

export function isMessageInteractionEvent(event: InteractionEvent): event is MessageInteractionEvent {
    return event.type === EventTypeEnum.MESSAGE;
}

export interface ButtonInteractionEvent extends InteractionEvent, ReplyInteractionEvent {
    currentInteraction: DiscordButtonInteraction;
    
    sendAsync(): Promise<void>;
    reactAsync(emoji: string): Promise<void>;
    deleteAsync(): Promise<void>;
}

export function isButtonInteractionEvent(event: InteractionEvent): event is ButtonInteractionEvent {
    return event.type === EventTypeEnum.BUTTON;
}

export interface SelectMenuInteractionEvent extends InteractionEvent, ReplyInteractionEvent {
    currentInteraction: DiscordStringSelectMenuInteraction;

    selected: string;
    deferReplyAsync(): Promise<void>;
    sendAsync(): Promise<void>;
}

export function isSelectMenuInteractionEvent(event: InteractionEvent): event is SelectMenuInteractionEvent {
    return event.type === EventTypeEnum.SELECT_MENU;
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
