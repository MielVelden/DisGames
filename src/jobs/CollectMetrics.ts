import { JobModule } from "../interfaces/application/Job";
import UserService from "../services/domain/UserService";
import MetricService from "../services/domain/MetricService";

export default {
    id: 'collect-metrics',
    name: 'Collect Metrics',
    description: 'Collect metrics',
    isEnabled: true,
    cronExpression: '0 0 */2 * * *',

    handler: async (progress): Promise<void> => {
        const identity = await UserService.getSystemUserAsync();
        await MetricService.collectMetricsAsync();
    }
} as JobModule;