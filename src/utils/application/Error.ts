import { ComponentErrorOptions } from "../../interfaces/application/Error";
import { Component } from "../../interfaces/application/Message";
import { ExceptionEnum } from "../../interfaces/enums";
import { i18n } from "../../utils/i18n/i18n";
import { MultiLingualString } from "../../utils/i18n/MultiLingualString";

export class ComponentError extends Error {
    public readonly components?: Component[];
    public readonly errorKey: ExceptionEnum;
    public readonly cause?: unknown;
    public readonly silently?: boolean;
    constructor(options: ComponentErrorOptions) {
        const translated = new MultiLingualString(i18n.exceptions[options.message]);
        if (options.parameters)
            translated.replaceParameters(options.parameters);

        super(translated.getMessage());
        this.name = 'ComponentError';
        this.components = options.components;
        this.errorKey = options.message;
        this.silently = options.silently ?? false;

        if (options.cause)
            this.cause = options.cause;

        Object.setPrototypeOf(this, new.target.prototype);
    }

    public hasComponents(): boolean {
        return Array.isArray(this.components) && this.components.length > 0;
    }

    public shouldAnnounceError(): boolean {
        if (this.silently)
            return false;

        switch(this.errorKey) {
            case ExceptionEnum.RECORD_NOT_FOUND:
            case ExceptionEnum.MESSAGE_CHANGE_DISABLED:
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
}

export function assertNever(x: never, origin: { [key: string]: string | number }): never {
    const originName = origin.constructor?.name ?? String(origin);
    throw new Error(i18n.labels.handleNever(x, originName).getMessage());
}