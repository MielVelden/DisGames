import { User } from "../domain/User";
import { Component, BaseSelectMenu } from "./Message";
import { Duration } from "../../utils/Duration";
import { ServersModel } from "../database/TableInterfaces";
import { Interaction as DiscordInteraction, Message as DiscordMessage } from "discord.js";
import { MultiLingualString } from "../../utils/i18n/MultiLangualString";
import { Command } from "./Command";

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
    type: EventTypeEnum;
    customId: string;

    currentInteraction: DiscordInteraction | DiscordMessage;

    components: Component[];
    addComponentAsync(component: Component): Promise<void>;
    addComponentsAsync(components: Component[]): Promise<void>;
    clearComponentsAsync(): Promise<void>;
    
    sendToChannelAsync(channelId: string, components: Component[]): Promise<void>;
    editAsync(content?: string): Promise<void>;
    editWithComponentAsync(component: Component): Promise<void>;

    getUserInputBySelectMenuAsync(selectMenu: BaseSelectMenu): Promise<SelectMenuInteractionEvent | null>;
    getUserInputByButtonsAsync(question: MultiLingualString, buttons: MultiLingualString[]): Promise<string | null>;

    user: User;
    server: ServersModel;

    messageId: string;
    channelId: string;
    guildId: string;
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
