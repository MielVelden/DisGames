import { JobModule } from "../interfaces/application/Job";
import { GameTypeEnum } from "../interfaces/enums";
import * as fs from 'fs';
import * as path from 'path';
import Logger from "../utils/application/Logger";

export default {
    id: 'cleanup-game-images',
    name: 'Cleanup Game Images',
    description: 'Cleanup game images',
    isEnabled: true,
    cronExpression: '0 0 2 * * *',

    handler: async (progress): Promise<void> => {
        const imagesPath = path.join(process.cwd(), 'images');
        const gameIds: GameTypeEnum[] = [GameTypeEnum.CONNECTIONS];

        let totalFiles = 0;
        for (const gameId of gameIds) {
            const gameDirectory = path.join(imagesPath, 'games', gameId.toString());
            if (fs.existsSync(gameDirectory)) {
                const files = fs.readdirSync(gameDirectory);
                totalFiles += files.filter(file => file.endsWith('.png')).length;
            }
        }

        let processedFiles = 0;

        for (const gameId of gameIds) {
            const gameDirectory = path.join(imagesPath, 'games', gameId.toString());
            if (!fs.existsSync(gameDirectory))
                continue;

            const files = fs.readdirSync(gameDirectory);
            const filesToDelete = files.filter(file => file.endsWith('.png'));

            for (const fileToDelete of filesToDelete) {
                fs.unlinkSync(path.join(gameDirectory, fileToDelete));
                Logger.logDebug(`Deleted game image: ${path.join(gameDirectory, fileToDelete)}`);

                processedFiles++;
                progress(processedFiles, totalFiles, `Deleting ${fileToDelete}`);
            }
        }

        if (totalFiles === 0) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second to avoid spamming the progress bar
            progress(1, 1, 'No files to delete');
        }
    }
} as JobModule;