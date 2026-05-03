import { METRIC_PULL_KEY } from "../../interfaces/domain";
import { MetricEnum } from "../../interfaces/enums/application/MetricEnum";
import MetricService from "../../services/domain/MetricService";
import { registerPull } from "../registries/MetricRegistry";

export function TrackMetric(metric: MetricEnum, amount = 1) {
    return function (
        target: any,
        propertyKey: string,
        descriptor?: PropertyDescriptor
    ) {
        // New TC39 decorator spec: target is the method, second arg is context
        if (descriptor === undefined) {
            const original = target as Function;
            return async function (this: any, ...args: any[]) {
                await MetricService.incrementAsync(metric, amount);
                return original.apply(this, args);
            } as any;
        }

        const original = descriptor.value;
        descriptor.value = async function (...args: any[]) {
            await MetricService.incrementAsync(metric, amount);
            return original.apply(this, args);
        };
        return descriptor;
    };
}

export function TrackMetricPull(metric: MetricEnum) {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        Reflect.defineMetadata(METRIC_PULL_KEY, metric, target, propertyKey);
        return descriptor;
    };
}

export function RegisterMetricPulls() {
    return function <T extends new (...args: any[]) => {}>(constructor: T) {
        return class extends constructor {
            constructor(...args: any[]) {
                super(...args);
                let proto = constructor.prototype;
                while (proto && proto !== Object.prototype) {
                    for (const key of Object.getOwnPropertyNames(proto)) {
                        const metric = Reflect.getMetadata(METRIC_PULL_KEY, proto, key);
                        if (metric !== undefined)
                            registerPull(metric, () => (this as any)[key]());
                    }
                    proto = Object.getPrototypeOf(proto);
                }
            }
        };
    };
}