import { container } from "tsyringe";
import { Service } from "../../interfaces/application/Service";
import { registerInit } from "../registries/InitRegistry";

export function registerService<T extends Service>(service: T): void {
    const serviceToken = (service.constructor as typeof Service).serviceToken;
    container.registerInstance(serviceToken, service);
    registerInit(() => service.initAsync());
}

export function getService<T extends Service>(serviceToken: symbol): T {
    return container.resolve<T>(serviceToken);
}