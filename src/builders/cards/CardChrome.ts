import { CanvasRenderingContext2D } from 'canvas';
import packageJson from "../../../package.json";
import {
    BRAND_RIGHT,
    BRAND_TOP,
    CARD_BORDER_COLOR,
    CARD_RADIUS,
    COLOR_PACK,
    COLOR_TEXT_FAINT,
    COLOR_TEXT_MUTED,
    FONT_MONO,
    SCALE,
} from './CardTokens';
import { CardTheme } from '../../interfaces/domain/StylePreset';
import { drawCardDecorations } from './CardDecorations';
import { drawText, fillCircle, roundedRectPath, strokeRoundedRect, TextStyle, withAlpha } from './CardPrimitives';

// The palette with every optional field filled in, so card code never has to fall back.
export type ResolvedCardPalette = Required<CardTheme['palette']>;

const DEFAULT_PALETTE: ResolvedCardPalette = { ...COLOR_PACK, textMuted: COLOR_TEXT_MUTED, textFaint: COLOR_TEXT_FAINT };

// The palette is bound to the canvas context, so every draw helper called with the
// same ctx sees the same palette without threading a parameter through each method.
// Concurrency-safe: one ctx per render, nothing shared on the card singletons.
const palettes = new WeakMap<CanvasRenderingContext2D, ResolvedCardPalette>();

export function getCardPalette(ctx: CanvasRenderingContext2D): ResolvedCardPalette {
    return palettes.get(ctx) ?? DEFAULT_PALETTE;
}

export function drawCardBackground(ctx: CanvasRenderingContext2D, width: number, height: number, theme?: CardTheme): void {
    const palette: ResolvedCardPalette = { ...DEFAULT_PALETTE, ...theme?.palette };
    palettes.set(ctx, palette);
    ctx.save();
    roundedRectPath(ctx, 0, 0, width, height, CARD_RADIUS);
    ctx.clip();

    const base = ctx.createLinearGradient(0, 0, 0, height);
    base.addColorStop(0, palette.base);
    base.addColorStop(1, palette.deep);
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, width, height);

    const topRight = ctx.createRadialGradient(width, 0, 0, width, 0, 420 * SCALE);
    topRight.addColorStop(0, withAlpha(palette.accent, 0.24));
    topRight.addColorStop(1, withAlpha(palette.accent, 0));
    ctx.fillStyle = topRight;
    ctx.fillRect(0, 0, width, height);

    const bottomLeft = ctx.createRadialGradient(0, height, 0, 0, height, 360 * SCALE);
    bottomLeft.addColorStop(0, withAlpha(palette.accent2, 0.18));
    bottomLeft.addColorStop(1, withAlpha(palette.accent2, 0));
    ctx.fillStyle = bottomLeft;
    ctx.fillRect(0, 0, width, height);

    if (theme?.decorations?.length)
        drawCardDecorations(ctx, width, height, theme.decorations);

    ctx.restore();

    strokeRoundedRect(ctx, 0, 0, width, height, CARD_RADIUS, {
        color: CARD_BORDER_COLOR,
        width: 1 * SCALE,
    });
}

export function drawBrand(ctx: CanvasRenderingContext2D, width: number): void {
    const palette = getCardPalette(ctx);
    const text = packageJson.name.toUpperCase();
    const fontSize = 10 * SCALE;
    const brandStyle: TextStyle = {
        font: `600 ${fontSize}px ${FONT_MONO}`,
        color: palette.textFaint,
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

    fillCircle(ctx, dotCx, top, dotR + 1.5 * SCALE, withAlpha(palette.accent, 0.2));
    fillCircle(ctx, dotCx, top, dotR, palette.accent);

    drawText(ctx, text, dotCx + dotR + gap, top, brandStyle);
}
