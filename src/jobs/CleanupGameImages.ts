import { JobModule } from "../interfaces/application/JobModule";
import MediaService from "../services/MediaService";

export default {
    id: 'cleanup-game-images',
    name: 'Cleanup Game Images',
    description: 'Cleanup game images',
    isEnabled: true,
    cronExpression: '0 0 2 * * *',

    handler: async (): Promise<void> => {
        await MediaService.cleanupGameImages();
    }
} as JobModule;