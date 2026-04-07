import { JobModule } from "../interfaces/application/Job";
import MetricService from "../services/domain/MetricService";

export default {
    id: 'flush-metrics',
    name: 'Flush Metrics',
    description: 'Update the cache list of the metrics',
    isEnabled: true,
    cronExpression: '0 */2 * * * *',

    handler: async (progress): Promise<void> => {
        MetricService.flushAsync();
        progress(1, 1, 'Flush completed');
    }
} as JobModule;