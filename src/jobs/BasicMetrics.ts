import { JobModule } from "../interfaces/application/Job";
import Logger from "../utils/application/Logger";
import { WebhookType } from "../interfaces/enums/application/Webhook";
import MetricService from "../services/domain/MetricService";
import { MetricEnum } from "../interfaces/enums";

export default {
    id: 'basic-metrics',
    name: 'Basic Metrics',
    description: 'Collect basic metrics',
    isEnabled: true,
    cronExpression: '0 0 2 * * *',

    handler: async (progress): Promise<void> => {
        const metricTypes = [
            MetricEnum.Guilds,
            MetricEnum.Members,
            MetricEnum.Users,
            MetricEnum.Servers,
            MetricEnum.Points,
        ];

        const metrics: Record<string, { current: any; previous: any; increase: number }> = {};

        for (const metricType of metricTypes) {
            const currentMetric = await MetricService.getLatestByMetricAsync(metricType);
            const previousMetric = await MetricService.getPreviousByMetricAsync(metricType);
            const increase = currentMetric.Value - previousMetric.Value;

            metrics[metricType] = {
                current: currentMetric,
                previous: previousMetric,
                increase,
            };
        }

        const metricLabels: Partial<Record<MetricEnum, string>> = {
            [MetricEnum.Guilds]: 'Guilds',
            [MetricEnum.Members]: 'Members',
            [MetricEnum.Users]: 'Users',
            [MetricEnum.Servers]: 'Servers',
            [MetricEnum.Points]: 'Total Points',
        };

        let message = '**Daily Metrics:**\n';
        for (const metricType of metricTypes) {
            message += `${metricLabels[metricType] || metricType}: ${metrics[metricType].current.Value}\n`;
        }

        Logger.logInfo(message, {
            webhookType: WebhookType.INFO,
            sendToDiscord: true,
        });

        progress(1, 1, 'Basic metrics collected');
    }
} as JobModule;