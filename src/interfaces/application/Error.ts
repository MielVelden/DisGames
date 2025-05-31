import { Component } from "./Message";

export interface ComponentErrorOptions {
    message: string;
    components?: Component[];
}

export class ComponentError extends Error {
    public readonly components?: Component[];

    constructor(options: ComponentErrorOptions) {
        super(options.message);
        this.name = 'ComponentError';
        this.components = options.components;
        
        Object.setPrototypeOf(this, ComponentError.prototype);
    }

    public hasComponents(): boolean {
        return this.components !== undefined && this.components.length > 0;
    }
} 