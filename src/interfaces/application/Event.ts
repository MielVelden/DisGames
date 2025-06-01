import { User } from "../domain/User";
import { Component, BaseSelectMenu, ActionButton } from "./Message";
import { Duration } from "../../utils/Duration";
import { ServersModel } from "../database/TableInterfaces";
import { Interaction as DiscordInteraction, Message as DiscordMessage } from "discord.js";
import { MultiLingualString } from "../../utils/i18n/MultiLangualString";

export enum EventType {
    SLASH_COMMAND = "SLASH_COMMAND",
    BUTTON = "BUTTON",
    SELECT_MENU = "SELECT_MENU",
    MODAL_SUBMIT = "MODAL_SUBMIT",
    MESSAGE = "MESSAGE",
}

export interface InteractionEvent {
    type: EventType;
    customId: string;

    currentInteraction: DiscordInteraction | DiscordMessage;

    components: Component[];
    addComponentAsync(component: Component): Promise<void>;
    addComponentsAsync(components: Component[]): Promise<void>;
    clearComponentsAsync(): Promise<void>;
    
    editAsync(): Promise<void>;

    getUserInputBySelectMenuAsync(selectMenu: BaseSelectMenu): Promise<SelectMenuInteractionEvent | null>;
    getUserInputByButtonsAsync(question: MultiLingualString, buttons: string[]): Promise<string | null>;

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
    commandName: string;

    getOption(name: string): string | number | boolean | undefined;
    getOption<T>(name: string): T | undefined;
}

export interface MessageInteractionEvent extends InteractionEvent, ReplyInteractionEvent {
    reactAsync(emoji: string): Promise<void>;
    deleteAsync(): Promise<void>;
    content: string;
}

export interface SelectMenuInteractionEvent extends InteractionEvent, ReplyInteractionEvent {
    selected: string;
    deferReplyAsync(): Promise<void>;
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
