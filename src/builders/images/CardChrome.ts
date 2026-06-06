import { CanvasRenderingContext2D } from 'canvas';
import { PROJECT_NAME } from '../../utils/constants/Project';
import {
    BRAND_RIGHT,
    BRAND_TOP,
    CARD_BORDER_COLOR,
    CARD_RADIUS,
    COLOR_PACK,
    COLOR_TEXT_FAINT,
    FONT_MONO,
    SCALE,
} from './CardTokens';
import { drawText, fillCircle, roundedRectPath, strokeRoundedRect, TextStyle, withAlpha } from './CardPrimitives';

export function drawCardBackground(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.save();
    roundedRectPath(ctx, 0, 0, width, height, CARD_RADIUS);
    ctx.clip();

    const base = ctx.createLinearGradient(0, 0, 0, height);
    base.addColorStop(0, COLOR_PACK.base);
    base.addColorStop(1, COLOR_PACK.deep);
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, width, height);

    const topRight = ctx.createRadialGradient(width, 0, 0, width, 0, 420 * SCALE);
    topRight.addColorStop(0, withAlpha(COLOR_PACK.accent, 0.24));
    topRight.addColorStop(1, withAlpha(COLOR_PACK.accent, 0));
    ctx.fillStyle = topRight;
    ctx.fillRect(0, 0, width, height);

    const bottomLeft = ctx.createRadialGradient(0, height, 0, 0, height, 360 * SCALE);
    bottomLeft.addColorStop(0, withAlpha(COLOR_PACK.accent2, 0.18));
    bottomLeft.addColorStop(1, withAlpha(COLOR_PACK.accent2, 0));
    ctx.fillStyle = bottomLeft;
    ctx.fillRect(0, 0, width, height);

    ctx.restore();

    strokeRoundedRect(ctx, 0, 0, width, height, CARD_RADIUS, {
        color: CARD_BORDER_COLOR,
        width: 1 * SCALE,
    });
}

export function drawBrand(ctx: CanvasRenderingContext2D, width: number): void {
    const text = PROJECT_NAME.toUpperCase();
    const fontSize = 10 * SCALE;
    const brandStyle: TextStyle = {
        font: `600 ${fontSize}px ${FONT_MONO}`,
        color: COLOR_TEXT_FAINT,
        baseline: 'middle',
    };
    ctx.font = brandStyle.font;
    const textWidth = ctx.measureText(text).width;
    const dotR = 2.5 * SCALE;
    const gap = 5 * SCALE;
    const totalWidth = dotR * 2 + gap + textWidth;
    const right = width - BRAND_RIGHT;
    const top = BRAND_TOP + fontSize / 2;
    const dotCx = right - totalWidth + dotR;

    fillCircle(ctx, dotCx, top, dotR + 1.5 * SCALE, withAlpha(COLOR_PACK.accent, 0.2));
    fillCircle(ctx, dotCx, top, dotR, COLOR_PACK.accent);

    drawText(ctx, text, dotCx + dotR + gap, top, brandStyle);
}
