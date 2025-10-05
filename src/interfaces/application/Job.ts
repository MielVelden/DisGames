export interface JobItem {
    id: string;
    name: string;
    description: string;
    isEnabled: boolean;
    cronExpression?: string;
}

export type JobProgressCallback = (current: number, total: number, message?: string) => void;

export interface JobModule extends JobItem {
    handler: (progress: JobProgressCallback) => Promise<void>;
}

export enum JobStatus {
    STARTED = 'started',
    ERROR = 'error',
    COMPLETED = 'completed',
}

export interface JobExecutionResult {
    executionId: string;
    jobId: string;
    status: JobStatus;
    message: string;
    startedAt?: Date;
}
