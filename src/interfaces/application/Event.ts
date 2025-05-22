import { User } from "../domain/User";
import { Component, BaseSelectMenu, ActionButton } from "./Message";
import { Duration } from "../../utils/Duration";

export interface InteractionEvent {
    customId: string;

    addComponentAsync(component: Component): Promise<void>;
    addComponentsAsync(components: Component[]): Promise<void>;

    replyAsync(): Promise<void>;
    replyAsync(content: string): Promise<void>;
    reactAsync(emoji: string): Promise<void>;
    editAsync(): Promise<void>;
    deleteAsync(): Promise<void>;

    getUserInputAsync(selectMenu: BaseSelectMenu): Promise<InteractionEvent>;
    getUserInputAsync(question: string, buttons: ActionButton[]): Promise<InteractionEvent>;

    getOption(name: string): string | number | boolean | undefined;

    user: User;

    messageId: string;
    channelId: string;
    guildId: string;
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
