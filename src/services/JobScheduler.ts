import * as schedule from 'node-schedule';
import * as fs from 'fs';
import * as path from 'path';
import { JobModule } from '../interfaces/application/JobModule';
import Logger from '../utils/Logger';
import Webhook, { WebhookType } from '../utils/Webhook';

export class JobScheduler {
    private static instance: JobScheduler;
    private jobs: Map<string, schedule.Job> = new Map();
    private jobModules: JobModule[] = [];

    private constructor() {
        this.loadJobs();
    }

    public static getInstance(): JobScheduler {
        if (!JobScheduler.instance) {
            JobScheduler.instance = new JobScheduler();
        }
        return JobScheduler.instance;
    }

    private loadJobs(): void {
        const jobsPath = path.join(__dirname, '..', 'jobs');

        try {
            const jobFiles = fs.readdirSync(jobsPath).filter(file =>
                file.endsWith('.ts') || file.endsWith('.js')
            );

            for (const file of jobFiles) {
                try {
                    const jobPath = path.join(jobsPath, file);
                    const jobModule = require(jobPath).default as JobModule;

                    if (jobModule && jobModule.id) {
                        this.jobModules.push(jobModule);
                        
                        if (jobModule.isEnabled) {
                            this.scheduleJob(jobModule);
                        }
                    }
                } catch (error) {
                    Logger.logError(`Failed to load job file ${file}:`, error as Error);
                }
            }
        } catch (error) {
            Logger.logError('Failed to load jobs directory:', error as Error);
        }
    }


    public async runAllJobs(): Promise<{ success: string[], failed: { jobId: string, error: string }[] }> {
        const results = {
            success: [] as string[],
            failed: [] as { jobId: string, error: string }[]
        };

        for (const jobModule of this.jobModules) {
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

        // Send webhook report
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


    private scheduleJob(jobModule: JobModule): void {
        try {
            const job = schedule.scheduleJob(jobModule.cronExpression, async () => {
                try {
                    await this.executeJob(jobModule);
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    await Logger.logError(`Scheduled job '${jobModule.id}' failed: ${errorMessage}`, error as Error, { 
                        webhookType: WebhookType.DEBUG, 
                        sendToDiscord: true 
                    });
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
            await jobModule.handler();

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
            
            throw error;
        }
    }

}

export default JobScheduler.getInstance();
