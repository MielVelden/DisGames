import * as schedule from 'node-schedule';
import { JobModule } from '../../interfaces/application/Job';
import JobService from './JobService';
import Logger from '../../utils/Logger';
import Webhook, { WebhookType } from '../../utils/Webhook';
import { ExceptionEnum } from '../../interfaces/enums';
import { ErrorHelper } from '../../utils/Error';

export class JobScheduler {
    private static instance: JobScheduler;
    private jobs: Map<string, schedule.Job> = new Map();

    private constructor() {
        this.scheduleJobs();
    }

    public static getInstance(): JobScheduler {
        if (!JobScheduler.instance) {
            JobScheduler.instance = new JobScheduler();
        }
        return JobScheduler.instance;
    }

    private scheduleJobs(): void {
        const jobModules = JobService.getJobModules();

        for (const jobModule of jobModules) {
            if (jobModule.isEnabled) {
                this.scheduleJob(jobModule);
            }
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

        const webhookEmbed = Webhook.createJobReportTemplate(
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

    private async executeJob(jobModule: JobModule): Promise<void> {
        const startTime = Date.now();

        try {
            const noOpProgress = (current: number, total: number, message?: string) => {};
            await jobModule.handler(noOpProgress);

            const duration = Date.now() - startTime;
            await Logger.logDebug(`Job '${jobModule.name}' completed in ${duration}ms`, {
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
