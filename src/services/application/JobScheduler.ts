import * as schedule from 'node-schedule';
import { JobModule } from '../../interfaces/application/Job';
import JobService from './JobService';
import Logger from '../../utils/application/Logger';
import Webhook from '../../utils/application/Webhook';
import { ExceptionEnum } from '../../interfaces/enums';
import { ErrorHelper } from '../../utils/application/Error';
import { createJobReportEmbed } from '../../builders/embeds/JobEmbed';
import { WebhookType } from '../../interfaces/application';

export class JobScheduler {
    private static instance: JobScheduler;
    private jobs: Map<string, schedule.Job> = new Map();

    private constructor() {
        setImmediate(() => this.scheduleJobs());
    }

    public static getInstance(): JobScheduler {
        if (!JobScheduler.instance)
            JobScheduler.instance = new JobScheduler();
        return JobScheduler.instance;
    }

    private scheduleJobs(): void {
        const jobModules = JobService.getJobModules();

        for (const jobModule of jobModules) {
            if (jobModule.isEnabled)
                this.scheduleJob(jobModule);
        }
    }

    public async runAllJobs(): Promise<{ success: string[], failed: { jobId: string, error: string }[] }> {
        const results = {
            success: [] as string[],
            failed: [] as { jobId: string, error: string }[]
        };

        const jobModules = JobService.getJobModules();

        for (const jobModule of jobModules) {
            try {
                await this.executeJob(jobModule);
                results.success.push(jobModule.id);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                results.failed.push({
                    jobId: jobModule.id,
                    error: errorMessage
                });
            }
        }

        const successCount = results.success.length;
        const failedCount = results.failed.length;

        const webhookEmbed = createJobReportEmbed(
            successCount,
            failedCount,
            results.success,
            results.failed
        );

        await Webhook.sendDiscordEmbed(webhookEmbed, WebhookType.DEBUG);

        return results;
    }

    public async runJobById(jobId: string): Promise<void> {
        const job = JobService.getJobById(jobId);

        if (!job)
            ErrorHelper.throwWithParameters(ExceptionEnum.JOB_NOT_FOUND, { jobId: jobId });

        await this.executeJob(job);
    }


    private scheduleJob(jobModule: JobModule): void {
        try {
            if (!jobModule.cronExpression)
                return;

            const job = schedule.scheduleJob(jobModule.cronExpression, async () => {
                try {
                    await this.executeJob(jobModule);
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    await Logger.logError(`Scheduled job '${jobModule.id}' failed: ${errorMessage}`, error as Error, {
                        webhookType: WebhookType.DEBUG,
                        sendToDiscord: true
                    });
                    ErrorHelper.wrap(error, ExceptionEnum.JOB_FAILED);
                }
            });

            if (job) {
                this.jobs.set(jobModule.id, job);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            Logger.logError(`Failed to schedule job '${jobModule.id}': ${errorMessage}`, error as Error, {
                webhookType: WebhookType.DEBUG,
                sendToDiscord: true
            });
        }
    }

    private static isHighFrequency(cronExpression?: string): boolean {
        if (!cronExpression) return false;
        const fields = cronExpression.trim().split(/\s+/);
        const minuteField = fields.length === 6 ? fields[1] : fields[0];

        if (minuteField === '*')
            return true;

        const stepMatch = minuteField.match(/^\*\/(\d+)$/);
        if (stepMatch)
            return parseInt(stepMatch[1]) < 15;

        const values = minuteField.split(',').map(Number).filter(n => !isNaN(n)).sort((a, b) => a - b);
        if (values.length > 1) {
            for (let i = 1; i < values.length; i++) {
                if (values[i] - values[i - 1] < 15)
                    return true;
            }
        }

        return false;
    }

    private async executeJob(jobModule: JobModule): Promise<void> {
        const startTime = Date.now();

        try {
            let completed = false;
            const progressCallback = (current: number, total: number, _message?: string) => {
                if (current >= total) 
                    completed = true;
            };

            await jobModule.handler(progressCallback);

            const duration = Date.now() - startTime;

            if (!completed)
                progressCallback(1, 1, `Job '${jobModule.name}' completed in ${duration}ms`);

            if (!JobScheduler.isHighFrequency(jobModule.cronExpression))
                await Logger.logInfo(`Job '${jobModule.name}' completed in ${duration}ms`, {
                    webhookType: WebhookType.DEBUG,
                    sendToDiscord: false
                });
        } catch (error) {
            const duration = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            await Logger.logError(`Job '${jobModule.name}' failed after ${duration}ms: ${errorMessage}`, error as Error, {
                webhookType: WebhookType.DEBUG,
                sendToDiscord: true
            });

            ErrorHelper.wrap(error, ExceptionEnum.JOB_FAILED);
        }
    }
}

export default JobScheduler.getInstance();
