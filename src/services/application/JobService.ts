import * as fs from 'fs';
import * as path from 'path';
import { JobModule, JobItem, JobExecutionResult, JobStatus, JobProgressCallback } from '../../interfaces/application/Job';
import { UniqueCodes } from '../../utils/helpers/UniqueCodes';
import Logger from '../../utils/application/Logger';
import { Service } from "../../interfaces/application/Service";
import { registerService } from "../../utils/container/Container";

export class JobService extends Service {
    private jobModules: JobModule[] = [];

    constructor() {
        super();
        this.loadJobs();
    }

    public async initAsync(): Promise<void> {}

    private loadJobs(): void {
        const jobsPath = path.join(__dirname, '..', '..', 'jobs');

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
                    }
                } catch (error) {
                    Logger.logError(`Failed to load job file ${file}:`, error as Error);
                }
            }
        } catch (error) {
            Logger.logError('Failed to load jobs directory:', error as Error);
        }
    }

    public getJobModules(): JobModule[] {
        return [...this.jobModules];
    }

    public getAllJobs(): JobItem[] {
        return this.jobModules.map(job => ({
            id: job.id,
            name: job.name,
            description: job.description,
            isEnabled: job.isEnabled,
            cronExpression: job.cronExpression
        }));
    }

    public async executeJobById(
        jobId: string, 
        progressCallback?: (executionId: string, jobId: string, current: number, total: number, message?: string) => void
    ): Promise<JobExecutionResult> {
        const job = this.jobModules.find(j => j.id === jobId);
        
        if (!job) {
            const executionId = UniqueCodes.generateTimestampCode();
            return {
                executionId,
                jobId,
                status: JobStatus.ERROR,
                message: `Job with id '${jobId}' not found`
            };
        }

        const executionId = UniqueCodes.generateTimestampCode();
        const startedAt = new Date();
        
        let completed = false;
        const wrappedProgressCallback: JobProgressCallback = (current: number, total: number, message?: string) => {
            if (current >= total) 
                completed = true;
            
            if (progressCallback)
                progressCallback(executionId, job.id, current, total, message);
        };

        job.handler(wrappedProgressCallback)
            .then(() => {
                if (!completed)
                    wrappedProgressCallback(1, 1, 'Completed');
            })
            .catch((error: Error) => {
                Logger.logError(`Job ${jobId} (execution: ${executionId}) failed:`, error);
            });

        return {
            executionId,
            jobId: job.id,
            status: JobStatus.STARTED,
            message: `Job '${job.name}' has been started`,
            startedAt
        };
    }

    public getJobById(jobId: string): JobModule | undefined {
        return this.jobModules.find(j => j.id === jobId);
    }
}

const jobService = new JobService();
registerService(jobService);
export default jobService;
