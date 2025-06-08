import { Media, MediaType } from "../interfaces/application/Image";
import * as fs from 'fs';
import * as path from 'path';
import { GameTypeEnum } from "../interfaces/enums";

class MediaService {
    private readonly imagesPath: string;
    private readonly notFoundImage: string;

    constructor() {
        this.imagesPath = path.join(__dirname, '../../images');
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

    public getGameImage(gameName: GameTypeEnum): string {
        const gameImagePath = path.join(this.imagesPath, 'games', `${gameName}.${MediaType.PNG}`);
        
        if (fs.existsSync(gameImagePath)) {
            return gameImagePath;
        }

        console.log(`[INFO] Game image not found: ${gameImagePath}, using NotFound.png`);
        return this.notFoundImage;
    }

    public getGameImageBuffer(gameName: GameTypeEnum): Buffer {
        const imagePath = this.getGameImage(gameName);
        return fs.readFileSync(imagePath);
    }
}

export default new MediaService(); 