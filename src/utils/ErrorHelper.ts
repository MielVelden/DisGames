import { ComponentErrorOptions } from "../interfaces/application/Error";
import { Component } from "../interfaces/application/Message";
import { ExceptionEnum } from "../interfaces/enums/domain/ExpectionEnum";
import { i18n } from "./i18n/i18n";
import { MultiLingualString } from "../interfaces/application/MultiLangualString";

export class ErrorHelper {
    static throwErrorWithComponents(message: ExceptionEnum, components: Component[]): never {
        throw new ComponentError({
            message,
            components
        });
    }

    static throwError(message: ExceptionEnum): never {
        throw new ComponentError({ message });
    }
}

export class ComponentError extends Error {
    public readonly components?: Component[];
    public readonly errorKey: ExceptionEnum;

    constructor(options: ComponentErrorOptions) {
        const message = new MultiLingualString(i18n.exceptions[options.message]).getMessage();
        super(message);
        this.name = 'ComponentError';
        this.components = options.components;
        this.errorKey = options.message;

        Object.setPrototypeOf(this, ComponentError.prototype);
    }

    public hasComponents(): boolean {
        return this.components !== undefined && this.components.length > 0;
    }
} 