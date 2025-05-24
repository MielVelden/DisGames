import { User } from "../domain/User";
import { Component, BaseSelectMenu, ActionButton } from "./Message";
import { Duration } from "../../utils/Duration";
import { Server } from "../domain/Server";

export interface InteractionEvent {
    customId: string;

    addComponentAsync(component: Component): Promise<void>;
    addComponentsAsync(components: Component[]): Promise<void>;

    replyAsync(): Promise<void>;
    replyAsync(content: string): Promise<void>;
    reactAsync(emoji: string): Promise<void>;
    editAsync(): Promise<void>;
    deleteAsync(): Promise<void>;

    getUserInputBySelectMenuAsync?(selectMenu: BaseSelectMenu): Promise<InteractionEvent>;
    getUserInputByButtonsAsync?(question: string, buttons: ActionButton[]): Promise<InteractionEvent>;

    user: User;
    server: Server;

    messageId: string;
    channelId: string;
    guildId: string;
}

export interface SlashCommandInteractionEvent extends InteractionEvent {
    commandName: string;

    getOption(name: string): string | number | boolean | undefined;
    getOption<T>(name: string): T | undefined;
}

export interface Handler {
    id: string;
    userId?: string;
    timeout?: Duration;
    handle: (interaction: InteractionEvent) => Promise<void>;
}

export interface ButtonHandler extends Handler {
}

export interface SelectMenuHandler extends Handler {
}
