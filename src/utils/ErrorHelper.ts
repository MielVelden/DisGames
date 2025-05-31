import { ComponentError } from "../interfaces/application/Error";
import { Component } from "../interfaces/application/Message";

export class ErrorHelper {
    static throwErrorWithComponents(message: string, components: Component[]): ComponentError {
        return new ComponentError({
            message,
            components
        });
    }

    static throwError(message: string): ComponentError {
        return new ComponentError({ message });
    }
} 