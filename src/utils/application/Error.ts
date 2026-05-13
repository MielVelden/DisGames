import { InteractionEvent, isReplyInteractionEvent } from "../../interfaces/application";
import { ComponentErrorOptions } from "../../interfaces/application/Error";
import { Component } from "../../interfaces/application/Message";
import { ExceptionEnum } from "../../interfaces/enums";
import ComponentService from "../../services/application/ComponentService";
import { i18n } from "../../utils/i18n/i18n";
import { createMultiLingualString, MultiLingualString } from "../../utils/i18n/MultiLingualString";
import Logger from "./Logger";

export class ComponentError extends Error {
    public readonly components?: Component[];
    public readonly errorKey: ExceptionEnum;
    public readonly cause?: unknown;
    public readonly silently?: boolean;
    public readonly parameters?: { [key: string]: string | number };

    constructor(options: ComponentErrorOptions) {
        const translated = new MultiLingualString(i18n.exceptions[options.message]);
        if (options.parameters)
            translated.replaceParameters(options.parameters);

        super(translated.getMessage());
        this.name = 'ComponentError';
        this.components = options.components;
        this.errorKey = options.message;
        this.silently = options.silently ?? false;
        this.parameters = options.parameters;

        if (options.cause)
            this.cause = options.cause;

        Object.setPrototypeOf(this, new.target.prototype);
    }

    public hasComponents(): boolean {
        return Array.isArray(this.components) && this.components.length > 0;
    }

    public getMessage(): string {
        const errorMessage = new MultiLingualString(i18n.exceptions[this.errorKey]);
        if (this.parameters)
            errorMessage.replaceParameters(this.parameters);
        return errorMessage.getMessage();
    }

    public shouldAnnounceError(): boolean {
        if (this.silently)
            return false;

        switch (this.errorKey) {
            case ExceptionEnum.RECORD_NOT_FOUND:
            case ExceptionEnum.MESSAGE_CHANGE_DISABLED:
            case ExceptionEnum.ANSWER_SKIPPED:
            case ExceptionEnum.SAME_USER_ALREADY_ANSWERED:
            case ExceptionEnum.INVALID_NUMBER:
            case ExceptionEnum.GAME_MODULE_NOT_FOUND:
                return false;
            default:
                return true;
        }
    }
}

export class ErrorHelper {
    static throw(message: ExceptionEnum): never {
        throw new ComponentError({ message });
    }

    static throwSilently(message: ExceptionEnum): never {
        throw new ComponentError({ message, silently: true });
    }

    static throwWithComponents(message: ExceptionEnum, components: Component[]): never {
        throw new ComponentError({ message, components });
    }

    static wrap(error: unknown, message: ExceptionEnum): never {
        throw new ComponentError({ message, cause: error });
    }

    static throwWithParameters(message: ExceptionEnum, parameters: { [key: string]: string | number }): never {
        throw new ComponentError({ message, parameters });
    }

    static throwIfNull(value: any | null | undefined, message: ExceptionEnum): void {
        if (!value)
            this.throw(message);
    }
}

export function assertNever(x: never, origin: { [key: string]: string | number }): never {
    const originName = origin.constructor?.name ?? String(origin);
    throw new Error(i18n.labels.handleNever(x, originName).getMessage());
}

function isTransientNetworkError(error: unknown): boolean {
    if (!error || typeof error !== 'object')
        return false;
    const e = error as { name?: string; code?: string };
    return e.name === 'ConnectTimeoutError' || e.code === 'UND_ERR_CONNECT_TIMEOUT';
}

export async function handleErrorAsync(error: unknown, event: InteractionEvent): Promise<void> {
    if (error instanceof ComponentError) {
        if (error.hasComponents()) {
            const errorMessage = createMultiLingualString(error.getMessage());
            event.clearComponentsAsync();
            event.addComponentAsync(ComponentService.createContent(errorMessage));
            for (const component of error.components!) {
                await event.addComponentAsync(component);
            }
        } else if (error.shouldAnnounceError()) {
            const errorMessage = createMultiLingualString(error.getMessage());
            await event.addComponentAsync(ComponentService.createContent(errorMessage));
        }

        if (isReplyInteractionEvent(event))
            await event.replyAsync();

        if (!error.silently)
            Logger.logError(`Error handling message`, error as Error, { includeStackTrace: false });
    } else if (isTransientNetworkError(error)) {
        await Logger.logWarning(`Error handling message: transient network error reaching Discord API`);
    } else {
        Logger.logError(`Error handling message`, error as Error);
    }
}