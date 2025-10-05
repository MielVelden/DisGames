import { DashboardEnum } from "../enums/view/DashboardEnum";
import { DashboardView } from "../view/Dashboard";

export interface Metrics_Metrics {
    informations: MetricsInfo[];
}

export interface MetricsInfo {
    dashboardEnum: DashboardEnum;
    metrics: DashboardView;
}