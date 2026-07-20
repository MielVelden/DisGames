import { CanvasRenderingContext2D } from 'canvas';
import { Color } from '../../../utils/helpers/Color';
import { formatDate } from '../../../utils/helpers/Date';
import { toRoman } from '../../../utils/helpers/Number';
import { ExceptionEnum, LanguageEnum } from '../../../interfaces/enums';
import { BadgeEnum } from '../../../interfaces/enums/application/BadgeEnum';
import {
    COLOR_TEXT,
    COLOR_TEXT_FAINT,
    COLOR_TEXT_MUTED,
    FONT_MONO,
    FONT_SANS,
    SCALE,
} from '../CardTokens';
import { drawText, fillRoundedRect, strokeRoundedRect, TextStyle, truncateText, withAlpha, wrapText } from '../CardPrimitives';
import { resolveBadgeVisualsAsync } from './BadgeVisuals';
import { ErrorHelper } from '../../../utils/application/Error';

export interface BadgeRowData {
    achievementEnum: BadgeEnum;
    date: Date;
    level: number;
    threshold: number;
}

const ACCENT_WIDTH = 4 * SCALE;
export const DEFAULT_ICON_SIZE = 36 * SCALE;
const ICON_RADIUS_RATIO = 0.25;
const EMOJI_FONT_RATIO = 0.5;
const CHIP_HEIGHT_RATIO = 14 / 36;
const CHIP_FONT_RATIO = 8.5 / 36;
const CHIP_PAD_RATIO = 5 / 36;

class BadgeRowRenderer {
    public async draw(
        ctx: CanvasRenderingContext2D,
        badge: BadgeRowData,
        x: number,
        y: number,
        width: number,
        height: number,
        language: LanguageEnum,
        iconSize: number = DEFAULT_ICON_SIZE,
    ): Promise<void> {
        const { color, image, title, description } = await resolveBadgeVisualsAsync(badge.achievementEnum, language, badge.level, badge.threshold);

        ctx.fillStyle = color;
        ctx.fillRect(x, y, ACCENT_WIDTH, height);

        const iconRadius = iconSize * ICON_RADIUS_RATIO;
        const iconX = x + ACCENT_WIDTH + 12 * SCALE;
        const iconY = y + (height - iconSize) / 2;
        fillRoundedRect(ctx, iconX, iconY, iconSize, iconSize, iconRadius, withAlpha(color, 0.18));
        strokeRoundedRect(ctx, iconX, iconY, iconSize, iconSize, iconRadius, {
            color: withAlpha(color, 0.3),
            width: 1 * SCALE,
        });

        const iconPad = iconSize * 0.2;
        if (image) {
            ctx.drawImage(image, iconX + iconPad, iconY + iconPad, iconSize - iconPad * 2, iconSize - iconPad * 2);
        } else {
            ErrorHelper.throwSilently(ExceptionEnum.RECORD_NOT_FOUND);
        }

        this.drawLevelChip(ctx, badge.level, iconX, iconY, iconSize, color);

        const dateRightPad = 12 * SCALE;
        const dateRight = x + width - dateRightPad;
        const textBlockHeight = 42 * SCALE;
        const textTop = y + (height - textBlockHeight) / 2;

        drawText(ctx, 'EARNED', dateRight, textTop + 1 * SCALE, {
            font: `600 ${9 * SCALE}px ${FONT_SANS}`,
            color: COLOR_TEXT_FAINT,
            align: 'right',
            baseline: 'top',
        });

        const dateStyle: TextStyle = {
            font: `500 ${10 * SCALE}px ${FONT_MONO}`,
            color: COLOR_TEXT_FAINT,
            align: 'right',
            baseline: 'top',
        };
        ctx.font = dateStyle.font;

        const formattedDate = formatDate(badge.date, true);
        const dateW = ctx.measureText(formattedDate).width;
        drawText(ctx, formattedDate, dateRight, textTop + 17 * SCALE, dateStyle);

        ctx.font = `600 ${9 * SCALE}px ${FONT_SANS}`;
        const earnedW = ctx.measureText('EARNED').width;
        const dateLeft = dateRight - Math.max(dateW, earnedW);

        const titleX = iconX + iconSize + 12 * SCALE;
        const titleMaxW = dateLeft - titleX - 8 * SCALE;

        const titleStyle: TextStyle = {
            font: `600 ${13 * SCALE}px ${FONT_SANS}`,
            color: COLOR_TEXT,
            baseline: 'top',
        };
        ctx.font = titleStyle.font;
        drawText(ctx, truncateText(ctx, title, titleMaxW), titleX, textTop, titleStyle);

        const descStyle: TextStyle = {
            font: `500 ${10.5 * SCALE}px ${FONT_SANS}`,
            color: COLOR_TEXT_MUTED,
            baseline: 'top',
        };
        ctx.font = descStyle.font;
        const descLines = wrapText(ctx, description, titleMaxW, 2);
        descLines.forEach((line, li) => {
            drawText(ctx, line, titleX, textTop + 17 * SCALE + li * 13 * SCALE, descStyle);
        });
    }

    private drawLevelChip(ctx: CanvasRenderingContext2D, level: number, iconX: number, iconY: number, iconSize: number, color: Color): void {
        const label = toRoman(level);
        if (!label) 
            return;

        const chipHeight = iconSize * CHIP_HEIGHT_RATIO;
        const chipRadius = chipHeight / 2;
        const chipPad = iconSize * CHIP_PAD_RATIO;
        const fontSize = iconSize * CHIP_FONT_RATIO;
        const offset = chipHeight * 0.15;

        const font = `700 ${fontSize}px ${FONT_MONO}`;
        ctx.font = font;
        const textW = ctx.measureText(label).width;
        const chipW = Math.max(textW + chipPad * 2, chipHeight);

        // Anchor to the icon's bottom-right corner, like a level pip on a game icon.
        const chipX = iconX + iconSize - chipW / 2 - offset;
        const chipY = iconY + iconSize - chipHeight / 2 - offset;

        fillRoundedRect(ctx, chipX, chipY, chipW, chipHeight, chipRadius, color);
        strokeRoundedRect(ctx, chipX, chipY, chipW, chipHeight, chipRadius, {
            color: 'rgba(0,0,0,0.35)',
            width: 1 * SCALE,
        });

        drawText(ctx, label, chipX + chipW / 2, chipY + chipHeight / 2 + 0.5 * SCALE, {
            font,
            color: '#ffffff',
            align: 'center',
            baseline: 'middle',
        });
    }
}

export default new BadgeRowRenderer();
