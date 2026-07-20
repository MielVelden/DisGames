import { CanvasRenderingContext2D } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';
import { GeneratedMedia, MediaType } from '../../interfaces/application/Media';
import { UniqueCodes } from '../../utils/helpers/UniqueCodes';
import Logger from '../../utils/application/Logger';
import { Color } from '../../utils/helpers/Color';
import * as primitives from './CardPrimitives';
import { GlowStop, StrokeStyle, TextStyle } from './CardPrimitives';

export { GlowStop, StrokeStyle, TextStyle } from './CardPrimitives';

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
        return primitives.withAlpha(hex, alpha);
    }

    protected roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
        primitives.roundedRectPath(ctx, x, y, width, height, radius);
    }

    protected fillRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, fill: Color | CanvasGradient): void {
        primitives.fillRoundedRect(ctx, x, y, width, height, radius, fill);
    }

    protected strokeRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, stroke: StrokeStyle): void {
        primitives.strokeRoundedRect(ctx, x, y, width, height, radius, stroke);
    }

    protected drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, style: TextStyle): void {
        primitives.drawText(ctx, text, x, y, style);
    }

    protected fillCircle(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, fill: Color | CanvasGradient): void {
        primitives.fillCircle(ctx, cx, cy, radius, fill);
    }

    protected drawRadialGlow(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, color: Color, stops: GlowStop[]): void {
        primitives.drawRadialGlow(ctx, cx, cy, radius, color, stops);
    }

    protected truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
        return primitives.truncateText(ctx, text, maxWidth);
    }

    protected wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
        return primitives.wrapText(ctx, text, maxWidth, maxLines);
    }
}
