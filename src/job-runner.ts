import dotenv from 'dotenv';
import JobScheduler from './services/application/JobScheduler';
import Logger from './utils/Logger';
import { WebhookType } from './utils/Webhook';

// Load environment variables
dotenv.config();

async function runJobs(): Promise<void> {
    const startTime = Date.now();
    
    try {
        Logger.logInfo('🚀 Starting job execution...');
        
        // Run all jobs
        const results = await JobScheduler.runAllJobs();
        
        const duration = Date.now() - startTime;
        const successCount = results.success.length;
        const failedCount = results.failed.length;
        
        if (successCount > 0) {
            Logger.logInfo(`✅ ${successCount} job(s) completed successfully (${duration}ms)`);
            results.success.forEach(jobId => {
                Logger.logInfo(`   ✓ ${jobId}`);
            });
        }
        
        if (failedCount > 0) {
            Logger.logInfo(`❌ ${failedCount} job(s) failed (${duration}ms)`);
            results.failed.forEach(failure => {
                Logger.logInfo(`   ✗ ${failure.jobId}: ${failure.error}`);
            });
        }

        if (successCount === 0 && failedCount === 0) {
            Logger.logInfo('ℹ️ No jobs found to execute');
        }

    } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        Logger.logError(`❌ Job runner failed (${duration}ms): ${errorMessage}`, error as Error);
        process.exit(1);
    }
}

// Run if this file is executed directly
if (require.main === module) {
    runJobs().then(() => {
        console.log('Job runner completed');
        process.exit(0);
    }).catch((error) => {
        console.error('Job runner error:', error);
        process.exit(1);
    });
}

export { runJobs };
