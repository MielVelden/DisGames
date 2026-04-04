import { MetricEnum } from "../enums/application/MetricEnum";
import { DashboardEnum } from "../enums/view/DashboardEnum";
import { DashboardResponse } from "../view/Dashboard";

export interface Metrics_Metrics {
    informations: MetricsInfo[];
}

export interface MetricsInfo {
    dashboardEnum: DashboardEnum;
    metrics: DashboardResponse;
}

export interface MetricPullRegistration {
    metric: MetricEnum;
    fnAsync: () => Promise<number>;
}