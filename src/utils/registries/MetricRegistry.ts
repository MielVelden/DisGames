import { MetricPullRegistration } from "../../interfaces/domain";
import { MetricEnum } from "../../interfaces/enums/application/MetricEnum";

const registrations: MetricPullRegistration[] = [];

export function registerPull(metric: MetricEnum, fnAsync: () => Promise<number>): void {
    registrations.push({ metric, fnAsync });
}

export function getPullRegistrations(): MetricPullRegistration[] {
    return registrations;
}
