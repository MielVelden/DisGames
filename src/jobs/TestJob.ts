import { JobModule } from "../interfaces/application/Job";
import Logger from "../utils/application/Logger";

export default {
    id: 'test-job',
    name: 'Test Job',
    description: 'Test job that processes 100 items over 10 seconds',
    isEnabled: true,

    handler: async (progress): Promise<void> => {
        const totalItems = 100;
        
        for (let i = 1; i <= totalItems; i++) {           
            progress(i, totalItems, `Processing item ${i}`);
            
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        Logger.logInfo('Test job completed successfully');
    }
} as JobModule;