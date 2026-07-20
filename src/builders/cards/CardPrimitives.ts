import { CanvasRenderingContext2D } from 'canvas';
import { Color } from '../../utils/helpers/Color';

export interface TextStyle {
    font: string;
    color: Color | CanvasGradient;
    align?: CanvasTextAlign;
    baseline?: CanvasTextBaseline;
}

export interface StrokeStyle {
    color: Color;
    width: number;
}

export type GlowStop = [offset: number, alpha: number];

export function withAlpha(hex: string, alpha: number): Color {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

export function roundedRectPath(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
): void {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

export function fillRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    fill: Color | CanvasGradient,
): void {
    roundedRectPath(ctx, x, y, width, height, radius);
    ctx.fillStyle = fill;
    ctx.fill();
}

export function strokeRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    stroke: StrokeStyle,
): void {
    const half = stroke.width / 2;
    roundedRectPath(ctx, x + half, y + half, width - stroke.width, height - stroke.width, radius);
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.stroke();
}

export function drawText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    style: TextStyle,
): void {
    ctx.font = style.font;
    ctx.fillStyle = style.color;
    ctx.textAlign = style.align ?? 'left';
    ctx.textBaseline = style.baseline ?? 'alphabetic';
    ctx.fillText(text, x, y);
}

export function fillCircle(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    fill: Color | CanvasGradient,
): void {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
}

export function drawRadialGlow(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    color: Color,
    stops: GlowStop[],
): void {
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    for (const [offset, alpha] of stops) {
        glow.addColorStop(offset, withAlpha(color, alpha));
    }

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

export function truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
    if (ctx.measureText(text).width <= maxWidth) return text;
    const ellipsis = '…';
    let lo = 0;
    let hi = text.length;
    while (lo < hi) {
        const mid = Math.floor((lo + hi + 1) / 2);
        if (ctx.measureText(text.slice(0, mid) + ellipsis).width <= maxWidth) lo = mid;
        else hi = mid - 1;
    }
    return text.slice(0, lo) + ellipsis;
}

export function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let current = '';
    for (let i = 0; i < words.length; i++) {
        const test = current ? `${current} ${words[i]}` : words[i];
        if (ctx.measureText(test).width <= maxWidth) {
            current = test;
        } else {
            if (current) lines.push(current);
            if (lines.length === maxLines - 1) {
                lines.push(truncateText(ctx, words.slice(i).join(' '), maxWidth));
                return lines;
            }
            current = words[i];
        }
    }
    if (current) lines.push(current);
    return lines;
}
