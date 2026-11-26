import { createCanvas, CanvasRenderingContext2D, Image } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';
import { Media, MediaType } from '../../interfaces/application/Media';
import { BaseCard, TextStyle } from './BaseCard';
import { SCALE, FONT_SANS, CARD_RADIUS, COLOR_TEXT, COLOR_PANEL_BORDER, COLOR_CHIP_BG, COLOR_CHIP_BORDER } from './CardTokens';
import { loadEmojiImageAsync } from './BadgeAsset';
import { Color } from '../../utils/helpers/Color';
import { CardTheme } from '../../interfaces/domain/StylePreset';
import { drawBrand, drawCardBackground, getCardPalette } from './CardChrome';
import { LanguageEnum } from '../../interfaces/enums';
import { LanguageTranslations } from '../../interfaces/application/i18n';
import { getMultiLingualString } from '../../utils/i18n/MultiLingualString';

const CARD_WIDTH = 584 * SCALE;
const CARD_HEIGHT = 210 * SCALE;

const PANEL_X = 22 * SCALE;
const PANEL_Y = 42 * SCALE;
const PANEL_WIDTH = CARD_WIDTH - PANEL_X * 2;
const PANEL_HEIGHT = CARD_HEIGHT - PANEL_Y - 22 * SCALE;
const PANEL_RADIUS = 14 * SCALE;
const PANEL_PADDING = 22 * SCALE;
const PANEL_FILL = 'rgba(0,0,0,0.42)';

const TILE_SIZE = 100 * SCALE;
const TILE_RADIUS = 20 * SCALE;
const TILE_TEXT_GAP = 22 * SCALE;
const ICON_SIZE = 60 * SCALE;
const WATERMARK_SIZE = 250 * SCALE;
const EMOJI_FONT = 52 * SCALE;

const TITLE_FONT = 38 * SCALE;
const TITLE_MIN_FONT = 22 * SCALE;
const TITLE_DESC_GAP = 10 * SCALE;
const DESC_FONT = 13.5 * SCALE;
const DESC_LINE = 19 * SCALE;
const DESC_MAX_LINES = 3;

const DEFAULT_STYLE_KEY = 'default';

export interface BannerContent {
    key: string;
    emoji: string;
    title: LanguageTranslations;
    description: LanguageTranslations;
}

class BannerCardService extends BaseCard {
    constructor() {
        super(path.join('images', 'generated', 'banners'));
    }

    public async getOrGenerateAsync(content: BannerContent, language: LanguageEnum, cardTheme?: CardTheme, styleId?: string | null): Promise<Media> {
        const name = `${content.key}-${language}-${styleId ?? DEFAULT_STYLE_KEY}`;
        const filepath = path.join(this.imagesPath, `${name}.png`);

        if (!fs.existsSync(filepath)) {
            this.ensureDirectoryExists(this.imagesPath);   // may have been removed while running
            const buffer = this.render(content, await loadEmojiImageAsync(content.emoji), language, cardTheme);
            const tempPath = `${filepath}.${process.pid}.${Date.now()}.tmp`;
            await fs.promises.writeFile(tempPath, buffer);
            await fs.promises.rename(tempPath, filepath);
        }

        return { url: filepath, name, type: MediaType.PNG };
    }

    private render(content: BannerContent, emojiImage: Image | null, language: LanguageEnum, cardTheme?: CardTheme): Buffer {
        const canvas = createCanvas(CARD_WIDTH, CARD_HEIGHT);
        const ctx = canvas.getContext('2d');

        drawCardBackground(ctx, CARD_WIDTH, CARD_HEIGHT, cardTheme);

        ctx.save();
        this.roundedRectPath(ctx, 0, 0, CARD_WIDTH, CARD_HEIGHT, CARD_RADIUS);
        ctx.clip();

        const palette = getCardPalette(ctx);

        this.drawBackdrop(ctx, palette.accent, palette.accent2, emojiImage, content.key);

        this.fillRoundedRect(ctx, PANEL_X, PANEL_Y, PANEL_WIDTH, PANEL_HEIGHT, PANEL_RADIUS, PANEL_FILL);
        this.strokeRoundedRect(ctx, PANEL_X, PANEL_Y, PANEL_WIDTH, PANEL_HEIGHT, PANEL_RADIUS, { color: COLOR_PANEL_BORDER, width: 1 * SCALE });

        const tileX = PANEL_X + PANEL_PADDING;
        const tileY = PANEL_Y + (PANEL_HEIGHT - TILE_SIZE) / 2;
        this.drawTile(ctx, content.emoji, emojiImage, tileX, tileY, palette.accent);

        const textX = tileX + TILE_SIZE + TILE_TEXT_GAP;
        const textWidth = PANEL_X + PANEL_WIDTH - PANEL_PADDING - textX;
        this.drawTexts(ctx, content, language, textX, textWidth, tileY + TILE_SIZE / 2);

        drawBrand(ctx, CARD_WIDTH);
        ctx.restore();

        return canvas.toBuffer('image/png');
    }

    private drawBackdrop(ctx: CanvasRenderingContext2D, accent: Color, accent2: Color, emojiImage: Image | null, key: string): void {
        const seed = [...key].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
        const shift = ((seed * 53) % 120) * SCALE;

        ctx.save();
        ctx.fillStyle = this.withAlpha(accent2, 0.16);
        ctx.beginPath();
        ctx.moveTo(CARD_WIDTH * 0.5 + shift * 0.3, 0);
        ctx.lineTo(CARD_WIDTH * 0.74 + shift * 0.3, 0);
        ctx.lineTo(CARD_WIDTH * 0.46 + shift * 0.3, CARD_HEIGHT);
        ctx.lineTo(CARD_WIDTH * 0.22 + shift * 0.3, CARD_HEIGHT);
        ctx.closePath();
        ctx.fill();

        if (emojiImage) {
            ctx.globalAlpha = 0.12;
            ctx.translate(CARD_WIDTH * 0.9, CARD_HEIGHT * 0.5);
            ctx.rotate(-0.28);
            ctx.drawImage(emojiImage, -WATERMARK_SIZE / 2, -WATERMARK_SIZE / 2, WATERMARK_SIZE, WATERMARK_SIZE);
        }
        ctx.restore();

        this.drawRadialGlow(ctx, CARD_WIDTH * 0.1, CARD_HEIGHT * 0.95, CARD_WIDTH * 0.4, accent2, [[0, 0.3], [1, 0]]);
        this.drawRadialGlow(ctx, CARD_WIDTH * 0.95, CARD_HEIGHT * 0.1, CARD_WIDTH * 0.35, accent, [[0, 0.18], [1, 0]]);
    }

    private drawTile(ctx: CanvasRenderingContext2D, emoji: string, emojiImage: Image | null, x: number, y: number, accent: Color): void {
        this.drawRadialGlow(ctx, x + TILE_SIZE / 2, y + TILE_SIZE / 2, TILE_SIZE * 0.9, accent, [[0, 0.3], [0.7, 0.08], [1, 0]]);
        this.fillRoundedRect(ctx, x, y, TILE_SIZE, TILE_SIZE, TILE_RADIUS, COLOR_CHIP_BG);
        this.strokeRoundedRect(ctx, x, y, TILE_SIZE, TILE_SIZE, TILE_RADIUS, { color: COLOR_CHIP_BORDER, width: 1 * SCALE });
        if (emojiImage) {
            ctx.drawImage(emojiImage, x + (TILE_SIZE - ICON_SIZE) / 2, y + (TILE_SIZE - ICON_SIZE) / 2, ICON_SIZE, ICON_SIZE);
            return;
        }

        // Fallback when the Twemoji package is not installed: plain text (monochrome).
        this.drawText(ctx, emoji, x + TILE_SIZE / 2, y + TILE_SIZE / 2 + 2 * SCALE, {
            font: `${EMOJI_FONT}px ${FONT_SANS}`,
            color: COLOR_TEXT,
            align: 'center',
            baseline: 'middle',
        });
    }

    private drawTexts(ctx: CanvasRenderingContext2D, content: BannerContent, language: LanguageEnum, x: number, maxWidth: number, centerY: number): void {
        const title = getMultiLingualString(content.title, language);

        // Shrink long translated names to fit rather than truncating them.
        let size = TITLE_FONT;
        ctx.font = `800 ${size}px ${FONT_SANS}`;
        while (size > TITLE_MIN_FONT && ctx.measureText(title).width > maxWidth) {
            size -= 2 * SCALE;
            ctx.font = `800 ${size}px ${FONT_SANS}`;
        }

        const titleText = this.truncateText(ctx, title, maxWidth);

        ctx.font = `500 ${DESC_FONT}px ${FONT_SANS}`;

        // Descriptions can be several paragraphs (the welcome text); the banner shows the first.
        const firstParagraph = getMultiLingualString(content.description, language).split(/\\n|\n/)[0].trim();
        const descLines = this.wrapText(ctx, firstParagraph, maxWidth, DESC_MAX_LINES);

        const blockHeight = size + TITLE_DESC_GAP + descLines.length * DESC_LINE;
        const top = centerY - blockHeight / 2;

        this.drawText(ctx, titleText, x, top, { font: `800 ${size}px ${FONT_SANS}`, color: COLOR_TEXT, align: 'left', baseline: 'top' });

        const descStyle: TextStyle = { font: `500 ${DESC_FONT}px ${FONT_SANS}`, color: getCardPalette(ctx).textMuted, align: 'left', baseline: 'top' };
        descLines.forEach((line, i) => this.drawText(ctx, line, x, top + size + TITLE_DESC_GAP + i * DESC_LINE, descStyle));
    }
}

export default new BannerCardService();
