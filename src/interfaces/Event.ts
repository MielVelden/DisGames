import { User } from "./User";
import { Component, BaseSelectMenu, ActionButton } from "./Message";

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

export interface ButtonHandler {
    id: string;
    userId?: string;
    handler: (interaction: InteractionEvent) => Promise<void>;
}

export interface SelectMenuHandler {
    id: string;
    userId?: string;
    handler: (interaction: InteractionEvent) => Promise<void>;
}
