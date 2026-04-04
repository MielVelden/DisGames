import { MetricEnum } from "../../interfaces/enums/application/MetricEnum";
import MetricService from "../../services/domain/MetricService";

export function TrackMetric(metric: MetricEnum, amount = 1) {
    return function (
        _target: any,
        _propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
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
        _propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const original = descriptor.value;

        MetricService.registerPull(metric, () => {
            const instance = target.constructor.instance;
            return original.call(instance);
        });

        return descriptor;
    };
}