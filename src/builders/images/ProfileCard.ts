import { createCanvas, CanvasRenderingContext2D } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';
import { BaseCard } from './BaseCard';

export interface StatRow {
    icon: string;
    label: string;
    value: string;
}

export interface Achievement {
    icon: string;
    iconColor: string;
    title: string;
    description: string;
    date: string;
}

export interface ProfileCardOptions {
    title?: string;
    stats?: StatRow[];
    achievementsTitle?: string;
    achievements?: Achievement[];
    accentColor?: string;
    sphereColor?: string;
}

// ── Layout constants ──────────────────────────────────────────────────────────
const SPHERE_R = 50;
const CARD_H = 280;   // both cards share the same height
const CARD_R = 22;

// Left card — starts lower because sphere sits on its top edge
const L_X = 10;
const L_Y = SPHERE_R + 8;          // 58
const L_W = 275;
const L_H = CARD_H;
const SPH_CX = L_X + L_W / 2;     // 147.5
const SPH_CY = L_Y;

// Right card — same height, bottom-aligned with left card
const GAP = 18;
const R_X = L_X + L_W + GAP;      // 303
const R_Y = L_Y;                   // same top → same bottom
const R_W = 326;
const R_H = CARD_H;

const CANVAS_W = R_X + R_W + 12;  // 641
const CANVAS_H = L_Y + CARD_H + 20;

const FILE_ROW_H = 70;
// ─────────────────────────────────────────────────────────────────────────────

class ProfileCard extends BaseCard {
    private readonly defaultConfig: Required<ProfileCardOptions> = {
        title: 'Your Progress',
        stats: [],
        achievementsTitle: 'Shared Files',
        achievements: [],
        accentColor: '#8B5CF6',
        sphereColor: '#8B5CF6',
    };

    constructor() {
        super(path.join('images', 'generated'));
    }

    public async generate(options: ProfileCardOptions = {}) {
        const config: Required<ProfileCardOptions> = { ...this.defaultConfig, ...options };
        const uniqueCode = this.generateUniqueCode();
        const filepath = path.join(this.imagesPath, `${uniqueCode}.png`);

        this.generateImageFile(config, filepath);

        return this.buildMedia(uniqueCode, filepath);
    }

    private generateImageFile(config: Required<ProfileCardOptions>, filepath: string): void {
        const canvas = createCanvas(CANVAS_W, CANVAS_H);
        const ctx = canvas.getContext('2d');

        this.drawCard(ctx, L_X, L_Y, L_W, L_H, CARD_R);
        this.drawCard(ctx, R_X, R_Y, R_W, R_H, CARD_R);

        this.drawSphere(ctx, config.sphereColor);
        this.drawLeftContent(ctx, config);
        this.drawRightContent(ctx, config);

        fs.writeFileSync(filepath, canvas.toBuffer('image/png'));
    }

    // ── Left panel ────────────────────────────────────────────────────────────

    private drawLeftContent(ctx: CanvasRenderingContext2D, config: Required<ProfileCardOptions>): void {
        const cx = SPH_CX;
        const belowSphere = SPH_CY + SPHERE_R + 18;  // ~126

        ctx.fillStyle = '#1f2937';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(config.title, cx, belowSphere);

        const dividerY = belowSphere + 20;
        this.drawDivider(ctx, L_X + 20, dividerY, L_X + L_W - 20);

        const statsStartY = dividerY + 28;
        config.stats.forEach((stat, i) => {
            this.drawStatRow(ctx, stat, L_X + 30, statsStartY + i * 42);
        });
    }

    private drawStatRow(ctx: CanvasRenderingContext2D, stat: StatRow, x: number, y: number): void {
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';

        ctx.font = '16px "Segoe UI Emoji", Arial';
        ctx.fillStyle = '#374151';
        ctx.fillText(stat.icon, x, y);

        ctx.font = '14px Arial';
        ctx.fillStyle = '#9ca3af';
        const labelText = `${stat.label}: `;
        const labelW = ctx.measureText(labelText).width;
        ctx.fillText(labelText, x + 28, y);

        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = '#374151';
        ctx.fillText(stat.value, x + 28 + labelW, y);
    }

    // ── Right panel ───────────────────────────────────────────────────────────

    private drawRightContent(ctx: CanvasRenderingContext2D, config: Required<ProfileCardOptions>): void {
        const padX = 20;
        const innerX = R_X + padX;
        const innerRight = R_X + R_W - padX;
        const headerY = R_Y + 22;

        ctx.textBaseline = 'middle';

        ctx.fillStyle = '#1f2937';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(config.achievementsTitle, innerX, headerY);

        const dividerY = headerY + 18;
        this.drawDivider(ctx, innerX, dividerY, innerRight);

        let rowY = dividerY + 1;
        config.achievements.forEach((file, i) => {
            this.drawFileRow(ctx, file, innerX, innerRight, rowY);
            rowY += FILE_ROW_H;
            if (i < config.achievements.length - 1) {
                this.drawDivider(ctx, innerX, rowY, innerRight);
            }
        });
    }

    private drawFileRow(
        ctx: CanvasRenderingContext2D,
        file: Achievement,
        x: number,
        rightEdge: number,
        rowY: number
    ): void {
        const iconSize = 44;
        const iconX = x;
        const iconY = rowY + (FILE_ROW_H - iconSize) / 2;

        this.drawRoundedRect(ctx, iconX, iconY, iconSize, iconSize, 8, file.iconColor);
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${file.icon.length > 2 ? 11 : 13}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(file.icon, iconX + iconSize / 2, iconY + iconSize / 2);

        const textX = iconX + iconSize + 12;
        const rowCenterY = rowY + FILE_ROW_H / 2;

        ctx.textAlign = 'left';
        ctx.fillStyle = '#111827';
        ctx.font = 'bold 14px Arial';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(file.title, textX, rowCenterY - 2);

        ctx.fillStyle = '#9ca3af';
        ctx.font = '12px Arial';
        ctx.fillText(file.description, textX, rowCenterY + 15);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#9ca3af';
        ctx.font = '12px Arial';
        ctx.textBaseline = 'middle';
        ctx.fillText(file.date, rightEdge, rowCenterY + 6);
    }

    // ── Shared drawing helpers ────────────────────────────────────────────────

    private drawCard(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.12)';
        ctx.shadowBlur = 24;
        ctx.shadowOffsetY = 5;
        this.drawRoundedRect(ctx, x, y, w, h, r, '#ffffff');
        ctx.restore();
    }

    private drawDivider(ctx: CanvasRenderingContext2D, x1: number, y: number, x2: number): void {
        ctx.save();
        ctx.strokeStyle = '#f3f4f6';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(x2, y);
        ctx.stroke();
        ctx.restore();
    }

    private drawSphere(ctx: CanvasRenderingContext2D, color: string): void {
        const cx = SPH_CX;
        const cy = SPH_CY;
        const r = SPHERE_R;

        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.22)';
        ctx.shadowBlur = 16;
        ctx.shadowOffsetY = 7;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.clip();

        const base = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.04, cx + r * 0.1, cy + r * 0.1, r * 1.2);
        base.addColorStop(0, this.adjustBrightness(color, 60));
        base.addColorStop(0.45, color);
        base.addColorStop(1, this.adjustBrightness(color, -50));
        ctx.fillStyle = base;
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

        const bumpR = r * 0.115;
        const spacingX = bumpR * 2.55;
        const spacingY = bumpR * 2.25;
        for (let row = -r; row <= r; row += spacingY) {
            const offsetX = Math.round(row / spacingY) % 2 === 0 ? 0 : bumpR * 1.27;
            for (let col = -r - bumpR; col <= r + bumpR; col += spacingX) {
                const bx = cx + col + offsetX;
                const by = cy + row;
                const dx = bx - cx, dy = by - cy;
                if (dx * dx + dy * dy >= (r - bumpR * 0.6) ** 2) continue;
                const z = Math.sqrt(Math.max(0, r * r - dx * dx - dy * dy)) / r;
                const bGrad = ctx.createRadialGradient(bx - bumpR * 0.35, by - bumpR * 0.35, 0, bx, by, bumpR);
                bGrad.addColorStop(0, this.withAlpha(this.adjustBrightness(color, 50 + z * 20), 0.9));
                bGrad.addColorStop(0.55, this.withAlpha(this.adjustBrightness(color, z * 15 - 10), 0.75));
                bGrad.addColorStop(1, this.withAlpha(this.adjustBrightness(color, -30), 0.5));
                ctx.beginPath();
                ctx.arc(bx, by, bumpR, 0, Math.PI * 2);
                ctx.fillStyle = bGrad;
                ctx.fill();
            }
        }

        const hl = ctx.createRadialGradient(cx - r * 0.32, cy - r * 0.38, 0, cx - r * 0.32, cy - r * 0.38, r * 0.62);
        hl.addColorStop(0, 'rgba(255,255,255,0.48)');
        hl.addColorStop(0.45, 'rgba(255,255,255,0.1)');
        hl.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = hl;
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

        ctx.restore();
    }

    private drawRoundedRect(
        ctx: CanvasRenderingContext2D,
        x: number, y: number, w: number, h: number, r: number, color: string
    ): void {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
    }

    private adjustBrightness(hex: string, amount: number): string {
        const r = Math.max(0, Math.min(255, parseInt(hex.slice(1, 3), 16) + amount));
        const g = Math.max(0, Math.min(255, parseInt(hex.slice(3, 5), 16) + amount));
        const b = Math.max(0, Math.min(255, parseInt(hex.slice(5, 7), 16) + amount));
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
}

export default new ProfileCard();
