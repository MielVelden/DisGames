import { JobModule } from "../interfaces/application/Job";
import UserService from "../services/domain/UserService";
import DashboardService from "../services/application/DashboardService";
import { DashboardEnum } from "../interfaces/enums/view/DashboardEnum";
import { MetricsInfo } from "../interfaces/domain";
import MetricsRepository from "../repositories/MetricsRepository";
import { MetricsSaveModel } from "../interfaces/database";

export default {
    id: 'collect-metrics',
    name: 'Collect Metrics',
    description: 'Collect metrics',
    isEnabled: false,
    cronExpression: '0 0 2 * * *',

    handler: async (progress): Promise<void> => {
        const identity = await UserService.getSystemUserAsync();
        const dashboards = Object.values(DashboardEnum);
        const informations: MetricsInfo[] = [];
        
        for (let i = 0; i < dashboards.length; i++) {
            const dashboard = dashboards[i];
            progress(i + 1, dashboards.length + 1, `Collecting ${dashboard} dashboard`);
            
            const metrics = await DashboardService.getDashboardAsync(dashboard, identity);
            informations.push({
                dashboardEnum: dashboard,
                metrics: metrics,
            });
        }
        
        progress(dashboards.length + 1, dashboards.length + 1, 'Saving metrics');
        
        await MetricsRepository.saveAsync(new MetricsSaveModel({
            Date: new Date(),
            MetricsJSON: {
                informations: informations,
            },
        }));
    }
} as JobModule;