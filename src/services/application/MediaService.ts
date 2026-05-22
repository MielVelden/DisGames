import { Media, MediaType } from "../../interfaces/application/Media";
import { GeneratedMedia } from "../../interfaces/application/Media";
import * as fs from 'fs';
import * as path from 'path';
import { GameTypeEnum } from "../../interfaces/enums";
import Logger from "../../utils/application/Logger";

class MediaService {
    private readonly imagesPath: string;
    private readonly notFoundImage: Media;
    private readonly bufferCache: Map<string, Buffer> = new Map();

    constructor() {
        this.imagesPath = path.join(process.cwd(), 'images');
        this.notFoundImage = {
            url: path.join(this.imagesPath, 'NotFound.png'),
            name: 'NotFound',
            type: MediaType.PNG
        };
    }

    public async initAsync(): Promise<void> {
        const preloadPaths: string[] = [this.notFoundImage.url];

        const baseNames: Array<'welcome' | 'profile' | 'aboutme' | 'settings'> =
            ['welcome', 'profile', 'aboutme', 'settings'];
        for (const name of baseNames)
            preloadPaths.push(path.join(this.imagesPath, `${name}.${MediaType.PNG}`));

        const gamesDir = path.join(this.imagesPath, 'games');
        try {
            const entries = await fs.promises.readdir(gamesDir);
            for (const file of entries) {
                if (file.endsWith(`.${MediaType.PNG}`))
                    preloadPaths.push(path.join(gamesDir, file));
            }
        } catch {
            // games dir absent in some test environments — skip silently
        }

        let loaded = 0;
        await Promise.all(preloadPaths.map(async (p) => {
            try {
                const buf = await fs.promises.readFile(p);
                this.bufferCache.set(p, buf);
                loaded++;
            } catch {
                // Missing file → skip; getMediaBufferAsync will fall back to NotFound
            }
        }));
        Logger.logInfo(`MediaService preloaded ${loaded} image(s) into buffer cache`);
    }

    /** @deprecated prefer getMediaBufferAsync — sync fs blocks the event loop. */
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

    public async getMediaAsync(image: Media): Promise<string> {
        const imagePath = path.join(this.imagesPath, `${image.name}.${image.type}`);
        if (await this.fileExistsAsync(imagePath))
            return imagePath;
        Logger.logInfo(`Image not found: ${image.name}.${image.type}, using NotFound.png`);
        return this.notFoundImage.url;
    }

    /** @deprecated prefer getMediaBufferAsync. */
    public getMediaBuffer(image: Media): Buffer {
        const imagePath = this.getMedia(image);
        return fs.readFileSync(imagePath);
    }

    /** @deprecated prefer getMediaBufferAsync. */
    public getMediaFromNameBuffer(name: string, type: MediaType): Buffer {
        const imagePath = this.getMediaFromName(name, type);
        return fs.readFileSync(imagePath);
    }

    public async getMediaBufferAsync(image: Media): Promise<Buffer> {
        const cachedByName = path.join(this.imagesPath, `${image.name}.${image.type}`);
        const cachedByUrl = image.url;

        const cached = this.bufferCache.get(cachedByUrl) ?? this.bufferCache.get(cachedByName);
        if (cached)
            return cached;

        const targetPath = (await this.fileExistsAsync(image.url)) ? image.url : cachedByName;
        try {
            const buf = await fs.promises.readFile(targetPath);
            this.bufferCache.set(targetPath, buf);
            return buf;
        } catch {
            const fallback = this.bufferCache.get(this.notFoundImage.url);
            if (fallback)
                return fallback;
            const buf = await fs.promises.readFile(this.notFoundImage.url);
            this.bufferCache.set(this.notFoundImage.url, buf);
            return buf;
        }
    }

    public async getBufferByPathAsync(filePath: string): Promise<Buffer> {
        const cached = this.bufferCache.get(filePath);
        if (cached)
            return cached;
        const buf = await fs.promises.readFile(filePath);
        this.bufferCache.set(filePath, buf);
        return buf;
    }

    /** @deprecated prefer mediaExistsAsync. */
    public mediaExists(image: Media): boolean {
        const imagePath = path.join(this.imagesPath, `${image.name}.${image.type}`);
        return fs.existsSync(imagePath);
    }

    public async mediaExistsAsync(image: Media): Promise<boolean> {
        const imagePath = path.join(this.imagesPath, `${image.name}.${image.type}`);
        return this.fileExistsAsync(imagePath);
    }

    public async fileExistsAsync(filePath: string): Promise<boolean> {
        if (this.bufferCache.has(filePath))
            return true;
        try {
            await fs.promises.access(filePath);
            return true;
        } catch {
            return false;
        }
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

        Logger.logDebug(() => `Game image not found: ${gameImagePath}, using NotFound.png`);
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

        Logger.logDebug(() => `Game image not found: ${gameImagePath}, using NotFound.png`);
        return this.notFoundImage;
    }

    public async getGameImageBufferAsync(gameName: GameTypeEnum): Promise<Buffer> {
        const media = this.getGameImage(gameName);
        return this.getBufferByPathAsync(media.url);
    }

    /** @deprecated prefer getGameImageBufferAsync. */
    public getGameImageBuffer(gameName: GameTypeEnum): Buffer {
        const media = this.getGameImage(gameName);
        return fs.readFileSync(media.url);
    }

    public async getMediaByGameIdAsync(gameId: number): Promise<GeneratedMedia[]> {
        const gameDirectory = path.join(this.imagesPath, 'games', gameId.toString());

        if (!(await this.fileExistsAsync(gameDirectory))) {
            Logger.logInfo(`Game directory not found: ${gameDirectory}`);
            return [];
        }

        try {
            const files = await fs.promises.readdir(gameDirectory);
            const mediaFiles: GeneratedMedia[] = [];

            for (const file of files) {
                if (file.endsWith('.png')) {
                    const filePath = path.join(gameDirectory, file);
                    const stats = await fs.promises.stat(filePath);

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

    /** @deprecated prefer getMediaByGameIdAsync. */
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

    public getBaseImage(name: 'welcome' | 'profile' | 'aboutme' | 'settings'): Media {
        const baseImagePath = path.join(this.imagesPath, `${name}.${MediaType.PNG}`);

        if (fs.existsSync(baseImagePath)) {
            return {
                url: baseImagePath,
                name: name,
                type: MediaType.PNG
            };
        }

        Logger.logDebug(() => `Base image not found: ${baseImagePath}, using NotFound.png`);
        return this.notFoundImage;
    }

    public _clearBufferCacheForTests(): void {
        this.bufferCache.clear();
    }

    public _bufferCacheSizeForTests(): number {
        return this.bufferCache.size;
    }
}

export default new MediaService();
