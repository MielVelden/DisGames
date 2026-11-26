import JobService from '../services/application/JobService';
import { JobItem, JobExecutionResult } from '../interfaces/application/Job';
import { wsService } from '../server';
import { JobProgressData } from '../interfaces/application/WebSocket';
import { getClientId } from '../middleware/RequestContext';
import { User } from '../interfaces/domain';

export class JobController {
    async getAllJobsAsync(_identity: User): Promise<JobItem[]> {
        return JobService.getAllJobs();
    }

    async executeJobAsync(jobId: string, _identity: User): Promise<JobExecutionResult> {
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

            wsService.broadcastJobProgressAsync(progressData);
        });

        if (clientId && result.executionId)
            await wsService.subscribeToJobAsync(clientId, result.executionId);

        return result;
    }
}
