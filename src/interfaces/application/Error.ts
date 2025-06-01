import { ExceptionEnum } from "../enums/domain/ExpectionEnum";
import { Component } from "./Message";

export interface ComponentErrorOptions {
    message: ExceptionEnum;
    components?: Component[];
}