import { Image, loadImage } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';
import Logger from '../../utils/application/Logger';
import { BadgeEnum } from '../../interfaces/enums/application/BadgeEnum';
import { EnumValue } from '../../interfaces/application/EnumType';
import { LanguageEnum } from '../../interfaces/enums';

const BASE_DIR = path.join(process.cwd(), 'images');
const RENDER_SIZE = 512;

const cache = new Map<string, Promise<Image | null>>();

export async function loadBadgeImageAsync(badge: BadgeEnum, color: string): Promise<Image | null> {
    return await loadAssetImageAsync("badges", badge, color);
}

export async function loadLanguageImageAsync(language: LanguageEnum): Promise<Image | null> {
    return await loadAssetImageAsync("languages", language);
}

const MEDAL_FILES: Record<number, string> = { 1: "gold", 2: "silver", 3: "bronze" };

export async function loadMedalImageAsync(rank: number): Promise<Image | null> {
    const name = MEDAL_FILES[rank];
    if (!name)
        return null;
    return await loadAssetImageAsync("leaderboard", name, "");
}

async function loadAssetImageAsync(asset: "badges" | "languages" | "leaderboard", value: EnumValue, color?: string): Promise<Image | null> {
    const key = `${asset}:${value}:${color || ''}`;
    let pending = cache.get(key);
    if (!pending) {
        pending = loadSvgAsync(path.join(BASE_DIR, asset, `${value}.svg`), color);
        cache.set(key, pending);
    }
    return pending;
}

async function loadSvgAsync(file: string, color?: string): Promise<Image | null> {
    try {
        let svg = await fs.promises.readFile(file, 'utf8');
        svg = svg.replace(/<svg\b([^>]*)>/, (_match, attrs) => {
            const cleanedAttrs = attrs.replace(/\s(width|height)="[^"]*"/g, '');
            return `<svg${cleanedAttrs} width="${RENDER_SIZE}" height="${RENDER_SIZE}">`;
        });

        if(color) {
            svg = svg
                .replace(/\sstroke="(?!none|transparent)[^"]*"/g, ' stroke="currentColor"')
                .replace(/\sfill="(?!none|transparent)[^"]*"/g, ' fill="currentColor"')
                .replace(/<svg /, `<svg style="color:${color}" `);
        }
        
        return await loadImage(Buffer.from(svg));
    } catch (error) {
        Logger.logError(`Failed to load badge asset ${file}:`, error as Error);
        return null;
    }
}
