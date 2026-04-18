import { MetricEnum } from "../enums/application/MetricEnum";

export const METRIC_PULL_KEY = 'metricPull';

export interface MetricPullRegistration {
    metric: MetricEnum;
    fnAsync: () => Promise<number>;
}

export interface CacheMetric {
    value: number;
    updated: boolean;
};
