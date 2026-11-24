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

        if (color) {
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


const emojiCache = new Map<string, Promise<Image | null>>();
const TWEMOJI_DIR = path.join(process.cwd(), 'node_modules', '@twemoji', 'svg');

export async function loadEmojiImageAsync(emoji: string): Promise<Image | null> {
    let pending = emojiCache.get(emoji);
    if (!pending) {
        pending = loadEmojiAsync(emoji);
        emojiCache.set(emoji, pending);
    }
    return pending;
}

async function loadEmojiAsync(emoji: string): Promise<Image | null> {
    const codePoints = [...emoji].map(c => c.codePointAt(0)!.toString(16));
    const withoutSelector = codePoints.filter(cp => cp !== 'fe0f');

    // Twemoji drops the variation selector
    const candidates = [...new Set([
        (codePoints.includes('200d') ? codePoints : withoutSelector).join('-'),
        codePoints.join('-'),
        withoutSelector.join('-'),
    ])];

    for (const name of candidates) {
        for (const dir of [path.join(TWEMOJI_DIR, 'assets'), TWEMOJI_DIR]) {
            const file = path.join(dir, `${name}.svg`);
            if (!fs.existsSync(file))
                continue;

            try {
                // Twemoji SVGs only carry a viewBox; node-canvas needs explicit dimensions.
                const svg = (await fs.promises.readFile(file, 'utf8'))
                    .replace(/<svg\b([^>]*)>/, (_match, attrs: string) => `<svg${attrs.replace(/\s(width|height)="[^"]*"/g, '')} width="${RENDER_SIZE}" height="${RENDER_SIZE}">`);
                return await loadImage(Buffer.from(svg));
            } catch (error) {
                Logger.logWarning(`Failed to load emoji asset ${file}: ${error}`);
            }
        }
    }
    return null;
}
