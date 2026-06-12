import { createCanvas, CanvasRenderingContext2D, Image } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';
import { GeneratedMedia } from '../../interfaces/application/Media';
import { BaseCard, TextStyle } from './BaseCard';
import {
    SCALE,
    FONT_SANS,
    FONT_MONO,
    CARD_RADIUS,
    COLOR_TEXT,
    COLOR_TEXT_MUTED,
    COLOR_TEXT_FAINT,
    COLOR_DIVIDER_STRONG,
} from './CardTokens';
import { drawCardBackground } from './CardChrome';
import { BadgeRowData } from './renderers/BadgeRowRenderer';
import { resolveBadgeVisuals } from './renderers/BadgeVisuals';
import { Color } from '../../utils/helpers/Color';
import { formatDate } from '../../utils/helpers/Date';
import { toRoman } from '../../utils/helpers/Number';
import { LanguageEnum } from '../../interfaces/enums';
import { DEFAULT_LANGUAGE } from '../../utils/i18n/MultiLingualString';

export interface BadgeCardData {
    userId: string;
    badge: BadgeRowData;
}

const CARD_WIDTH = 440 * SCALE;
const PADDING = 28 * SCALE;

const ICON_SIZE = 132 * SCALE;
const ICON_TOP_GAP = 22 * SCALE;

const GAP_ICON_TIER = 16 * SCALE;
const TIER_FONT = 16 * SCALE;
const GAP_TIER_TITLE = 22 * SCALE;
const TITLE_FONT = 26 * SCALE;
const GAP_TITLE_DESC = 11 * SCALE;
const DESC_FONT = 13.5 * SCALE;
const DESC_LINE = 19 * SCALE;
const GAP_DESC_EARNED = 24 * SCALE;
const EARNED_LABEL_FONT = 9.5 * SCALE;
const DATE_FONT = 12 * SCALE;
const DESC_MAX_LINES = 3;

const measureCtx = createCanvas(1, 1).getContext('2d');

class BadgeCardService extends BaseCard {
    constructor() {
        super(path.join('images', 'generated'));
    }

    public async generateAsync(data: BadgeCardData, language: LanguageEnum = DEFAULT_LANGUAGE): Promise<GeneratedMedia> {
        const uniqueCode = this.generateUniqueCode();
        const filepath = path.join(this.imagesPath, `${data.userId}-${uniqueCode}.png`);

        const visuals = await resolveBadgeVisuals(data.badge.achievementEnum, language, data.badge.level, data.badge.threshold);

        measureCtx.font = `500 ${DESC_FONT}px ${FONT_SANS}`;
        const descLines = this.wrapText(measureCtx, visuals.description, CARD_WIDTH - PADDING * 2.4, DESC_MAX_LINES);

        const cx = CARD_WIDTH / 2;
        const iconTop = PADDING + ICON_TOP_GAP;
        const iconCenterY = iconTop + ICON_SIZE / 2;
        const tierTop = iconTop + ICON_SIZE + GAP_ICON_TIER;
        const titleTop = tierTop + TIER_FONT + GAP_TIER_TITLE;
        const descTop = titleTop + TITLE_FONT + GAP_TITLE_DESC;
        const descBottom = descTop + descLines.length * DESC_LINE;
        const dividerY = descBottom + GAP_DESC_EARNED;
        const dateTop = dividerY + 26 * SCALE;
        const cardHeight = dateTop + DATE_FONT + PADDING;

        const canvas = createCanvas(CARD_WIDTH, cardHeight);
        const ctx = canvas.getContext('2d');

        drawCardBackground(ctx, CARD_WIDTH, cardHeight);

        ctx.save();
        this.roundedRectPath(ctx, 0, 0, CARD_WIDTH, cardHeight, CARD_RADIUS);
        ctx.clip();

        this.drawThemedGlow(ctx, visuals.color, cx, iconCenterY, cardHeight);
        this.drawIcon(ctx, visuals.image, visuals.icon, visuals.color, cx, iconCenterY);
        this.drawTier(ctx, data.badge.level, visuals.color, cx, tierTop);
        this.drawTitle(ctx, visuals.title, cx, titleTop);
        this.drawDescriptionLines(ctx, descLines, cx, descTop);
        this.drawEarned(ctx, data.badge.date, cx, dividerY, dateTop);

        ctx.restore();

        await fs.promises.writeFile(filepath, canvas.toBuffer('image/png'));

        return this.buildMedia(uniqueCode, filepath, {
            name: `${data.userId}-${uniqueCode}`,
        });
    }

    private drawThemedGlow(ctx: CanvasRenderingContext2D, color: Color, cx: number, cy: number, height: number): void {
        const themed = ctx.createRadialGradient(cx, cy, 0, cx, cy, CARD_WIDTH * 0.7);
        themed.addColorStop(0, this.withAlpha(color, 0.26));
        themed.addColorStop(0.55, this.withAlpha(color, 0.06));
        themed.addColorStop(1, this.withAlpha(color, 0));
        ctx.fillStyle = themed;
        ctx.fillRect(0, 0, CARD_WIDTH, height);
    }

    private drawIcon(ctx: CanvasRenderingContext2D, image: Image | null, icon: string, color: Color, cx: number, cy: number): void {
        // Soft outer glow in the badge color so the icon pops off the background.
        this.drawRadialGlow(ctx, cx, cy, ICON_SIZE * 0.8, color, [
            [0, 0.4],
            [0.7, 0.1],
            [1, 0],
        ]);

        if (image) {
            // Full-color Twemoji art, centered in the icon box.
            ctx.drawImage(image, cx - ICON_SIZE / 2, cy - ICON_SIZE / 2, ICON_SIZE, ICON_SIZE);
            return;
        }

        // Fallback when the emoji asset is missing: neutral glyph.
        this.drawText(ctx, icon, cx, cy + 2 * SCALE, {
            font: `${ICON_SIZE}px ${FONT_SANS}`,
            color: COLOR_TEXT,
            align: 'center',
            baseline: 'middle',
        });
    }

    private drawTier(ctx: CanvasRenderingContext2D, level: number, color: Color, cx: number, y: number): void {
        const label = toRoman(level);
        if (!label) return;

        const style: TextStyle = {
            font: `800 ${TIER_FONT}px ${FONT_MONO}`,
            color: COLOR_TEXT_MUTED,
            align: 'center',
            baseline: 'middle',
        };
        ctx.font = style.font;
        const textW = ctx.measureText(label).width;

        // Engraved look: the numeral flanked by two short rules in the badge color.
        const ruleLen = 26 * SCALE;
        const ruleGap = 12 * SCALE;
        const midY = y + TIER_FONT / 2;
        ctx.strokeStyle = this.withAlpha(color, 0.5);
        ctx.lineWidth = 1.5 * SCALE;

        const halfText = textW / 2;
        ctx.beginPath();
        ctx.moveTo(cx - halfText - ruleGap - ruleLen, midY);
        ctx.lineTo(cx - halfText - ruleGap, midY);
        ctx.moveTo(cx + halfText + ruleGap, midY);
        ctx.lineTo(cx + halfText + ruleGap + ruleLen, midY);
        ctx.stroke();

        this.drawText(ctx, label, cx, midY, style);
    }

    private drawTitle(ctx: CanvasRenderingContext2D, title: string, cx: number, y: number): void {
        const style: TextStyle = {
            font: `800 ${TITLE_FONT}px ${FONT_SANS}`,
            color: COLOR_TEXT,
            align: 'center',
            baseline: 'top',
        };
        ctx.font = style.font;
        const text = this.truncateText(ctx, title, CARD_WIDTH - PADDING * 2);
        this.drawText(ctx, text, cx, y, style);
    }

    private drawDescriptionLines(ctx: CanvasRenderingContext2D, lines: string[], cx: number, y: number): void {
        const style: TextStyle = {
            font: `500 ${DESC_FONT}px ${FONT_SANS}`,
            color: COLOR_TEXT_MUTED,
            align: 'center',
            baseline: 'top',
        };
        lines.forEach((line, i) => {
            this.drawText(ctx, line, cx, y + i * DESC_LINE, style);
        });
    }

    private drawEarned(ctx: CanvasRenderingContext2D, date: Date, cx: number, dividerY: number, dateTop: number): void {
        const dividerW = 56 * SCALE;
        ctx.fillStyle = COLOR_DIVIDER_STRONG;
        ctx.fillRect(cx - dividerW / 2, dividerY, dividerW, 1 * SCALE);

        this.drawText(ctx, 'EARNED', cx, dividerY + 12 * SCALE, {
            font: `700 ${EARNED_LABEL_FONT}px ${FONT_SANS}`,
            color: COLOR_TEXT_FAINT,
            align: 'center',
            baseline: 'top',
        });

        this.drawText(ctx, formatDate(date, true), cx, dateTop, {
            font: `500 ${DATE_FONT}px ${FONT_MONO}`,
            color: COLOR_TEXT_MUTED,
            align: 'center',
            baseline: 'top',
        });
    }
}

export default new BadgeCardService();
