import { User } from "../domain/User";
import { Component, BaseSelectMenu } from "./Message";
import { ServersModel, TimelineEntriesSaveModel } from "../database/TableInterfaces";
import { Interaction as DiscordInteraction, Message as DiscordMessage } from "discord.js";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";
import { Command } from "./Command";
import { Games_Settings, GameSettingsSchema, GameSettingsValues } from "../domain/GameSettings";
import { Duration } from "./Duration";

export enum EventTypeEnum {
    SLASH_COMMAND = "SLASH_COMMAND",
    BUTTON = "BUTTON",
    SELECT_MENU = "SELECT_MENU",
    MODAL_SUBMIT = "MODAL_SUBMIT",
    MESSAGE = "MESSAGE",
    MESSAGE_UPDATE = "MESSAGE_UPDATE",
    MESSAGE_DELETE = "MESSAGE_DELETE",
}

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

export interface SlashCommandInteractionEvent extends InteractionEvent, ReplyInteractionEvent {
    command: Command;
    
    getOption(name: string): string | number | boolean | undefined;
    getOption<T>(name: string): T | undefined;
    handleCommandOptionsAsync(): Promise<void>;
    getFollowUpOption(key: string): string | number | boolean | undefined;
    setFollowUpOption(key: string, value: string | number | boolean): void;
    followUpOptions: Record<string, string | number | boolean>;
}

export interface MessageInteractionEvent extends InteractionEvent, ReplyInteractionEvent {
    command?: Command;
    
    sendAsync(): Promise<void>;
    reactAsync(emoji: string): Promise<void>;

    messageDeleted: boolean;
    deleteAsync(): Promise<void>;
    content: string;
}

export interface ButtonInteractionEvent extends InteractionEvent, ReplyInteractionEvent {
    sendAsync(): Promise<void>;
    reactAsync(emoji: string): Promise<void>;
    deleteAsync(): Promise<void>;
}

export interface SelectMenuInteractionEvent extends InteractionEvent, ReplyInteractionEvent {
    selected: string;
    deferReplyAsync(): Promise<void>;
    sendAsync(): Promise<void>;
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
