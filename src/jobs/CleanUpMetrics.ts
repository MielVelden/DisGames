import { JobModule } from "../interfaces/application/Job";
import MetricService from "../services/domain/MetricService";
import { DurationEnum } from "../interfaces/application/Duration";
import { calculateDuration } from "../utils/helpers/Duration";

export default {
    id: 'cleanup-metrics',
    name: 'Cleanup Metrics',
    description: 'Downsample metrics older than 7 days to one row per 6 hours',
    isEnabled: true,
    cronExpression: '0 30 2 * * *',

    handler: async (progress): Promise<void> => {
        await MetricService.cleanupOldMetricsAsync(
            calculateDuration(7, DurationEnum.DAY),
            calculateDuration(6, DurationEnum.HOUR),
        );

        progress(1, 1, 'Metrics cleanup completed');
    }
} as JobModule;
