import { Media, MediaType } from "../../interfaces/application/Media";
import { GeneratedMedia } from "../../interfaces/application/Media";
import * as fs from 'fs';
import * as path from 'path';
import { GameTypeEnum } from "../../interfaces/enums";
import Logger from "../../utils/application/Logger";

class MediaService {
    private readonly imagesPath: string;
    private readonly notFoundImage: Media;

    constructor() {
        this.imagesPath = path.join(process.cwd(), 'images');
        this.notFoundImage = {
            url: path.join(this.imagesPath, 'NotFound.png'),
            name: 'NotFound',
            type: MediaType.PNG
        };
    }

    public getMedia(image: Media): string {
        const imagePath = path.join(this.imagesPath, `${image.name}.${image.type}`);

        if (fs.existsSync(imagePath)) {
            return imagePath;
        }

        Logger.logInfo(`Image not found: ${image.name}.${image.type}, using NotFound.png`);
        return this.notFoundImage.url;
    }

    public getMediaFromName(name: string, type: MediaType): string {
        const image: Media = {
            url: '',
            name,
            type
        };

        return this.getMedia(image);
    }

    public getMediaBuffer(image: Media): Buffer {
        const imagePath = this.getMedia(image);
        return fs.readFileSync(imagePath);
    }

    public getMediaFromNameBuffer(name: string, type: MediaType): Buffer {
        const imagePath = this.getMediaFromName(name, type);
        return fs.readFileSync(imagePath);
    }

    public mediaExists(image: Media): boolean {
        const imagePath = path.join(this.imagesPath, `${image.name}.${image.type}`);
        return fs.existsSync(imagePath);
    }

    public getGameImage(gameName: GameTypeEnum): Media {
        const gameImagePath = path.join(process.cwd(), 'images', 'games', `${gameName}.${MediaType.PNG}`);

        if (fs.existsSync(gameImagePath)) {
            return {
                url: gameImagePath,
                name: gameName.toString(),
                type: MediaType.PNG
            };
        }

        Logger.logDebug(`Game image not found: ${gameImagePath}, using NotFound.png`);
        return this.notFoundImage;
    }

    public getGameDataImage(gameId: GameTypeEnum, gameDataId: number): Media {
        const gameImagePath = path.join(process.cwd(), 'images', 'games', `${gameId}`, `${gameDataId}.${MediaType.GIF}`);

        if (fs.existsSync(gameImagePath)) {
            return {
                url: gameImagePath,
                name: `${gameId}_${gameDataId}`,
                type: MediaType.PNG
            };
        }

        Logger.logDebug(`Game image not found: ${gameImagePath}, using NotFound.png`);
        return this.notFoundImage;
    }

    public getGameImageBuffer(gameName: GameTypeEnum): Buffer {
        const media = this.getGameImage(gameName);
        return fs.readFileSync(media.url);
    }

    public getMediaByGameId(gameId: number): GeneratedMedia[] {
        const gameDirectory = path.join(this.imagesPath, 'games', gameId.toString());

        if (!fs.existsSync(gameDirectory)) {
            Logger.logInfo(`Game directory not found: ${gameDirectory}`);
            return [];
        }

        try {
            const files = fs.readdirSync(gameDirectory);
            const mediaFiles: GeneratedMedia[] = [];

            for (const file of files) {
                if (file.endsWith('.png')) {
                    const filePath = path.join(gameDirectory, file);
                    const stats = fs.statSync(filePath);

                    const nameWithoutExt = file.replace('.png', '');
                    const parts = nameWithoutExt.split('-');

                    if (parts.length >= 2) {
                        const serverId = parts[0];
                        const uniqueCode = parts.slice(1).join('-');

                        mediaFiles.push({
                            id: uniqueCode,
                            url: filePath,
                            name: nameWithoutExt,
                            type: MediaType.PNG,
                            createdAt: stats.birthtime,
                            gameId: gameId,
                            serverId: serverId
                        });
                    }
                }
            }

            return mediaFiles.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        } catch (error) {
            Logger.logError(`Error reading game directory ${gameDirectory}: ${error}`);
            return [];
        }
    }

    public getBaseImage(name: 'welcome' | 'profile' | 'aboutme'): Media {
        const baseImagePath = path.join(this.imagesPath, `${name}.${MediaType.PNG}`);

        if (fs.existsSync(baseImagePath)) {
            return {
                url: baseImagePath,
                name: name,
                type: MediaType.PNG
            };
        }

        Logger.logDebug(`Base image not found: ${baseImagePath}, using NotFound.png`);
        return this.notFoundImage;
    }
}

export default new MediaService(); 