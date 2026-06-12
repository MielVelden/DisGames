import { Image, loadImage } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';
import Logger from '../../utils/application/Logger';
import { BadgeEnum } from '../../interfaces/enums/application/BadgeEnum';

const BADGE_DIR = path.join(process.cwd(), 'images', 'badges');
const RENDER_SIZE = 512;

const cache = new Map<string, Promise<Image | null>>();

export function loadBadgeImage(badge: BadgeEnum, color: string): Promise<Image | null> {
    const key = `${badge}:${color}`;
    let pending = cache.get(key);
    if (!pending) {
        pending = loadSvg(path.join(BADGE_DIR, `${BadgeEnum[badge]}.svg`), color);
        cache.set(key, pending);
    }
    return pending;
}

async function loadSvg(file: string, color: string): Promise<Image | null> {
    try {
        let svg = await fs.promises.readFile(file, 'utf8');
        svg = svg
            .replace(/\s(width|height)="[^"]*"/g, '')
            .replace(/<svg /, `<svg width="${RENDER_SIZE}" height="${RENDER_SIZE}" `)
            .replace(/\sstroke="(?!none|transparent)[^"]*"/g, ' stroke="currentColor"')
            .replace(/\sfill="(?!none|transparent)[^"]*"/g, ' fill="currentColor"')
            .replace(/<svg /, `<svg style="color:${color}" `);
        return await loadImage(Buffer.from(svg));
    } catch (error) {
        Logger.logError(`Failed to load badge asset ${file}:`, error as Error);
        return null;
    }
}
