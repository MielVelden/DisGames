import { Image, loadImage } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';
import Logger from '../../utils/application/Logger';

const EMOJI_DIR = path.join(process.cwd(), 'assets', 'emoji');
const RENDER_SIZE = 256;

const cache = new Map<string, Promise<Image | null>>();

export function emojiToCodepoints(emoji: string): string {
    return Array.from(emoji)
        .map(ch => ch.codePointAt(0)!)
        .filter(cp => cp !== 0xfe0f)
        .map(cp => cp.toString(16))
        .join('-');
}

export function loadEmojiImage(emoji: string): Promise<Image | null> {
    const code = emojiToCodepoints(emoji);
    let pending = cache.get(code);
    if (!pending) {
        pending = loadSvg(path.join(EMOJI_DIR, `${code}.svg`));
        cache.set(code, pending);
    }
    return pending;
}

async function loadSvg(file: string): Promise<Image | null> {
    try {
        let svg = await fs.promises.readFile(file, 'utf8');
        if (!/<svg[^>]*\swidth=/.test(svg))
            svg = svg.replace('<svg ', `<svg width="${RENDER_SIZE}" height="${RENDER_SIZE}" `);
        return await loadImage(Buffer.from(svg));
    } catch (error) {
        Logger.logError(`Failed to load emoji asset ${file}:`, error as Error);
        return null;
    }
}
