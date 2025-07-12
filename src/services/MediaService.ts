import { Media, MediaType } from "../interfaces/application/Image";
import * as fs from 'fs';
import * as path from 'path';
import { GameTypeEnum } from "../interfaces/enums";

class MediaService {
    private readonly imagesPath: string;
    private readonly notFoundImage: string;

    constructor() {
        this.imagesPath = path.join(process.cwd(), 'images');
        this.notFoundImage = path.join(this.imagesPath, 'NotFound.png');
    }

    public getMedia(image: Media): string {
        const imagePath = path.join(this.imagesPath, `${image.name}.${image.type}`);
        
        if (fs.existsSync(imagePath)) {
            return imagePath;
        }

        console.log(`[INFO] Image not found: ${image.name}.${image.type}, using NotFound.png`);
        return this.notFoundImage;
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

        console.log(`[INFO] Game image not found: ${gameImagePath}, using NotFound.png`);
        return {
            url: this.notFoundImage,
            name: 'NotFound',
            type: MediaType.PNG
        };
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

        console.log(`[INFO] Game image not found: ${gameImagePath}, using NotFound.png`);
        return {
            url: this.notFoundImage,
            name: 'NotFound',
            type: MediaType.PNG
        };
    }

    public getGameImageBuffer(gameName: GameTypeEnum): Buffer {
        const media = this.getGameImage(gameName);
        return fs.readFileSync(media.url);
    }
}

export default new MediaService(); 