import { CanvasRenderingContext2D } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';
import { GeneratedMedia, MediaType } from '../../interfaces/application/Media';
import { UniqueCodes } from '../../utils/helpers/UniqueCodes';
import Logger from '../../utils/application/Logger';
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

export abstract class BaseCard {
    protected readonly imagesPath: string;

    constructor(outputPath: string) {
        this.imagesPath = path.join(process.cwd(), outputPath);
        this.ensureDirectoryExists(this.imagesPath);
    }

    protected ensureDirectoryExists(dirPath: string): void {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
            Logger.logInfo(`Created directory: ${dirPath}`);
        }
    }

    protected generateUniqueCode(): string {
        return UniqueCodes.generateCode(12);
    }

    protected buildMedia(
        uniqueCode: string,
        filepath: string,
        extra?: Partial<GeneratedMedia>
    ): GeneratedMedia {
        return {
            id: uniqueCode,
            url: filepath,
            name: uniqueCode,
            type: MediaType.PNG,
            createdAt: new Date(),
            ...extra,
        };
    }

    protected withAlpha(hex: string, alpha: number): Color {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${alpha})`;
    }

    protected roundedRectPath(
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

    protected fillRoundedRect(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        width: number,
        height: number,
        radius: number,
        fill: Color | CanvasGradient,
    ): void {
        this.roundedRectPath(ctx, x, y, width, height, radius);
        ctx.fillStyle = fill;
        ctx.fill();
    }

    protected strokeRoundedRect(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        width: number,
        height: number,
        radius: number,
        stroke: StrokeStyle,
    ): void {
        const half = stroke.width / 2;
        this.roundedRectPath(ctx, x + half, y + half, width - stroke.width, height - stroke.width, radius);
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width;
        ctx.stroke();
    }

    protected drawText(
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

    protected fillCircle(
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

    protected drawRadialGlow(
        ctx: CanvasRenderingContext2D,
        cx: number,
        cy: number,
        radius: number,
        color: Color,
        stops: GlowStop[],
    ): void {
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        for (const [offset, alpha] of stops) {
            glow.addColorStop(offset, this.withAlpha(color, alpha));
        }

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
