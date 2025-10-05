import JobService from '../services/application/JobService';
import { JobItem, JobExecutionResult } from '../interfaces/application/Job';
import { wsService } from '../server';
import { JobProgressData } from '../interfaces/application/WebSocket';
import { getClientId } from '../middleware/RequestContext';
import Logger from '../utils/Logger';

export class JobController {
    async getAllJobsAsync(): Promise<JobItem[]> {
        return JobService.getAllJobs();
    }

    async executeJobAsync(jobId: string): Promise<JobExecutionResult> {
        const clientId = getClientId();

        const result = await JobService.executeJobById(jobId, (executionId, jobId, current, total, message) => {
            const progress = Math.round((current / total) * 100);
            
            const progressData: JobProgressData = {
                executionId,
                jobId,
                progress,
                current,
                total,
                message
            };

            wsService.broadcastJobProgress(progressData);
        });

        if (clientId && result.executionId) {
            await wsService.subscribeToJob(clientId, result.executionId);
        }

        return result;
    }
}
