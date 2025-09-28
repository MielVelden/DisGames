import { User } from "../domain/User";

export interface Controller {
    getByIdAsync(id: string | number, identity: User): Promise<any>;
    getAllAsync(identity: User): Promise<any[]>;
}

export interface EndpointInfo {
    controllerName: string;
    methodName: string;
    parameters: ParameterInfo[];
    returnType: string;
}

export interface ParameterInfo {
    name: string;
    type: string;
    isIdentity: boolean;
}

export interface InterfaceInfo {
    name: string;
    category: string;
    content: string;
}