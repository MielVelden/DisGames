import { JobModule } from "../interfaces/application/Job";
import Logger from "../utils/application/Logger";
import { WebhookType } from "../interfaces/enums/application/Webhook";
import MetricService from "../services/domain/MetricService";
import { LanguageEnum, MetricEnum } from "../interfaces/enums";
import { i18n } from "../utils/i18n/i18n";
import { MultiLingualString } from "../utils/i18n/MultiLingualString";

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

        let message = '**Daily Metrics:**\n';
        for (const metricType of metricTypes) {
            const enumName = new MultiLingualString(i18n.metrics[metricType]).getMessage(LanguageEnum.EN);
            message += `${enumName || metricType}: ${metrics[metricType].current.Value} (+${metrics[metricType].increase})\n`;
        }

        Logger.logInfo(message, {
            webhookType: WebhookType.INFO,
            sendToDiscord: true,
        });

        progress(1, 1, 'Basic metrics collected');
    }
} as JobModule;