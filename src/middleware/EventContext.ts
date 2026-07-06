import { AsyncLocalStorage } from "async_hooks";
import { BaseInteractionEvent } from "../interfaces/application/Event";
import { LanguageEnum } from "../interfaces/enums/database/LanguageEnum";
import { ServersModel } from "../interfaces/database";
import { Component } from "../interfaces/application";

type EventStore = { event: BaseInteractionEvent };

export const eventContext = new AsyncLocalStorage<EventStore>();

export function withEventContext<T>(event: BaseInteractionEvent, callback: () => T): T {
    return eventContext.run({ event }, callback);
}

export function withEventContextAsync<T>(event: BaseInteractionEvent, callback: () => Promise<T>): Promise<T> {
    return eventContext.run({ event }, callback);
}

export function getCurrentEvent(): BaseInteractionEvent | undefined {
    return eventContext.getStore()?.event;
}

export function getCurrentLanguage(): LanguageEnum | undefined {
    return eventContext.getStore()?.event?.server?.LanguageEnum;
}

export function getCurrentServer(): ServersModel | undefined {
    return eventContext.getStore()?.event?.server;
}

export function getCurrentComponents(): Component[] | undefined {
    return eventContext.getStore()?.event?.components;
}