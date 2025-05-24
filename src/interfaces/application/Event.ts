import { User } from "../domain/User";
import { Component, BaseSelectMenu, ActionButton } from "./Message";
import { Duration } from "../../utils/Duration";
import { Server } from "../domain/Server";
import { Interaction as DiscordInteraction } from "discord.js";

export enum EventType {
    SLASH_COMMAND = "SLASH_COMMAND",
    BUTTON = "BUTTON",
    SELECT_MENU = "SELECT_MENU",
    MODAL_SUBMIT = "MODAL_SUBMIT",
}

export interface InteractionEvent {
    type: EventType;
    customId: string;

    currentInteraction: DiscordInteraction;

    components: Component[];
    addComponentAsync(component: Component): Promise<void>;
    addComponentsAsync(components: Component[]): Promise<void>;

    editAsync(): Promise<void>;

    getUserInputBySelectMenuAsync?(selectMenu: BaseSelectMenu): Promise<InteractionEvent>;
    getUserInputByButtonsAsync?(question: string, buttons: ActionButton[]): Promise<InteractionEvent>;

    user: User;
    server: Server;

    messageId: string;
    channelId: string;
    guildId: string;
}

export interface ReplyInteractionEvent extends InteractionEvent {
    replyAsync(content?: string): Promise<void>;
}

export interface SlashCommandInteractionEvent extends InteractionEvent, ReplyInteractionEvent {
    commandName: string;

    getOption(name: string): string | number | boolean | undefined;
    getOption<T>(name: string): T | undefined;
}

export interface MessageInteractionEvent extends InteractionEvent, ReplyInteractionEvent {
    reactAsync(emoji: string): Promise<void>;
    deleteAsync(): Promise<void>;
}

export interface Handler {
    id: string;
    userId?: string;
    timeout?: Duration;
    handle: (interaction: InteractionEvent) => Promise<void>;
}

export interface HandlerConfig extends Omit<Handler, "id"> {
}

export interface ButtonHandler extends Handler {
}

export interface SelectMenuHandler extends Handler {
}
