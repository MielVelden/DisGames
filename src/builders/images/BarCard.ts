import { createCanvas, CanvasRenderingContext2D } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';
import { BaseCard } from './BaseCard';

export interface ProgressBarOptions {
    trackColor?: string;
    barStartColor?: string;
    barEndColor?: string;
    glowColor?: string;
    textColor?: string;
    textAbove?: string;
    textFormat?: (percent: number) => string;
}

interface ProgressBarConfig {
    canvasWidth: number;
    barHeight: number;
    borderRadius: number;
    paddingX: number;
    trackColor: string;
    barStartColor: string;
    barEndColor: string;
    glowColor: string;
    textColor: string;
    fontSize: number;
    textAbove?: string;
    textFormat: (percent: number) => string;
}

class ProgressBarService extends BaseCard {
    private readonly defaultConfig: ProgressBarConfig = {
        canvasWidth: 1200,
        barHeight: 18,
        borderRadius: 9,
        paddingX: 60,
        trackColor: '#1e2d42',
        barStartColor: '#6b7ff0',
        barEndColor: '#4a9eff',
        glowColor: '#a0c8ff',
        textColor: '#ffffff',
        fontSize: 26,
        textFormat: (p) => `${p}% completed`,
    };

    constructor() {
        super(path.join('images', 'generated'));
    }

    public async generate(
        percent: number,
        options: ProgressBarOptions = {}
    ) {
        const clampedPercent = Math.max(0, Math.min(100, Math.round(percent)));
        const config = this.mergeConfig(options);

        const uniqueCode = this.generateUniqueCode();
        const filepath = path.join(this.imagesPath, `${uniqueCode}.png`);

        this.generateImageFile(clampedPercent, config, filepath);

        return this.buildMedia(uniqueCode, filepath);
    }

    private mergeConfig(options: ProgressBarOptions): ProgressBarConfig {
        return {
            ...this.defaultConfig,
            ...(options.trackColor && { trackColor: options.trackColor }),
            ...(options.barStartColor && { barStartColor: options.barStartColor }),
            ...(options.barEndColor && { barEndColor: options.barEndColor }),
            ...(options.glowColor && { glowColor: options.glowColor }),
            ...(options.textColor && { textColor: options.textColor }),
            ...(options.textAbove !== undefined && { textAbove: options.textAbove }),
            ...(options.textFormat && { textFormat: options.textFormat }),
        };
    }

    private generateImageFile(percent: number, config: ProgressBarConfig, filepath: string): void {
        const { canvasWidth, barHeight, borderRadius, paddingX } = config;

        const textAboveHeight = config.textAbove ? config.fontSize + 14 : 0;
        const canvasHeight = textAboveHeight + barHeight + config.fontSize + 28;

        const canvas = createCanvas(canvasWidth, canvasHeight);
        const ctx = canvas.getContext('2d');

        const barY = textAboveHeight + 4;
        const barWidth = canvasWidth - paddingX * 2;
        const fillWidth = Math.round(barWidth * (percent / 100));

        if (config.textAbove) {
            this.drawOutlinedText(ctx, config.textAbove, canvasWidth / 2, config.fontSize / 2 + 4, config.fontSize, config.textColor);
        }

        this.drawRoundedRect(ctx, paddingX, barY, barWidth, barHeight, borderRadius, config.trackColor);

        if (fillWidth > 0) {
            const grad = ctx.createLinearGradient(paddingX, 0, paddingX + fillWidth, 0);
            grad.addColorStop(0, config.barStartColor);
            grad.addColorStop(1, config.barEndColor);
            this.drawRoundedRect(ctx, paddingX, barY, fillWidth, barHeight, borderRadius, grad);
        }

        if (fillWidth > borderRadius)
            this.drawGlow(ctx, paddingX + fillWidth, barY + barHeight / 2, config.glowColor);

        const textBelowY = barY + barHeight + config.fontSize / 2 + 10;
        this.drawOutlinedText(ctx, config.textFormat(percent), canvasWidth / 2, textBelowY, config.fontSize, config.textColor);

        fs.writeFileSync(filepath, canvas.toBuffer('image/png'));
    }

    private drawOutlinedText(
        ctx: CanvasRenderingContext2D,
        text: string,
        x: number,
        y: number,
        fontSize: number,
        fillColor: string
    ): void {
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = Math.max(4, fontSize * 0.18);
        ctx.strokeText(text, x, y);
        ctx.fillStyle = fillColor;
        ctx.fillText(text, x, y);
    }

    private drawGlow(ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string): void {
        const radius = 40;
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        glow.addColorStop(0, this.withAlpha(color, 0.6));
        glow.addColorStop(0.4, this.withAlpha(color, 0.2));
        glow.addColorStop(1, this.withAlpha(color, 0));

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    private drawRoundedRect(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        width: number,
        height: number,
        radius: number,
        fill: string | CanvasGradient
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
        ctx.fillStyle = fill;
        ctx.fill();
    }
}

export default new ProgressBarService();
