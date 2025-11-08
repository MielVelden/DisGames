import { ExceptionEnum } from "../enums/application/ExpectionEnum";
import { Component } from "./Message";

export interface ComponentErrorOptions {
    message: ExceptionEnum;
    components?: Component[];
    cause?: unknown;
    parameters?: { [key: string]: string | number };
}