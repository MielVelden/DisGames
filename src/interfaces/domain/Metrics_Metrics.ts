import { DashboardEnum } from "../enums/view/DashboardEnum";
import { DashboardResponse } from "../view/Dashboard";

export interface Metrics_Metrics {
    informations: MetricsInfo[];
}

export interface MetricsInfo {
    dashboardEnum: DashboardEnum;
    metrics: DashboardResponse;
}