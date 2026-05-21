import * as fs from 'fs';
import * as path from 'path';
import { GeneratedMedia, MediaType } from '../../interfaces/application/Media';
import { UniqueCodes } from '../../utils/helpers/UniqueCodes';
import Logger from '../../utils/application/Logger';

export abstract class BaseCard {
    protected readonly imagesPath: string;

    constructor(outputPath: string) {
        this.imagesPath = path.join(process.cwd(), outputPath);
        this.ensureDirectoryExists(this.imagesPath);
    }

    protected ensureDirectoryExists(dirPath: string): void {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
            Logger.logInfo(`Created directory: ${dirPath}`);
        }
    }

    protected generateUniqueCode(): string {
        return UniqueCodes.generateCode(12);
    }

    protected buildMedia(
        uniqueCode: string,
        filepath: string,
        extra?: Partial<GeneratedMedia>
    ): GeneratedMedia {
        return {
            id: uniqueCode,
            url: filepath,
            name: uniqueCode,
            type: MediaType.PNG,
            createdAt: new Date(),
            ...extra,
        };
    }

    protected withAlpha(hex: string, alpha: number): string {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${alpha})`;
    }
}
