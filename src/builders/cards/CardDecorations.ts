import { CanvasRenderingContext2D } from 'canvas';
import { CardDecorationEnum } from '../../interfaces/enums/application/CardDecorationEnum';
import { SCALE } from './CardTokens';

type Painter = (ctx: CanvasRenderingContext2D, width: number, height: number) => void;

const LIGHT_COLORS = ['#ff4d4d', '#ffd54a', '#4dd2ff', '#6be585'];

function rand(min: number, max: number): number {
    return min + Math.random() * (max - min);
}

function drawSnowflake(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number): void {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const dx = Math.cos(angle) * radius;
        const dy = Math.sin(angle) * radius;
        ctx.moveTo(x - dx, y - dy);
        ctx.lineTo(x + dx, y + dy);
        // small branches at 60% of each arm
        const bx = x + dx * 0.6;
        const by = y + dy * 0.6;
        for (const side of [-1, 1]) {
            const branch = angle + side * (Math.PI / 4);
            ctx.moveTo(bx, by);
            ctx.lineTo(bx + Math.cos(branch) * radius * 0.28, by + Math.sin(branch) * radius * 0.28);
        }
    }
    ctx.stroke();
}

function drawBat(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    ctx.beginPath();
    ctx.moveTo(x, y + size * 0.3);
    for (const dir of [-1, 1]) {
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + dir * size * 0.5, y - size * 0.65, x + dir * size, y - size * 0.15);
        ctx.quadraticCurveTo(x + dir * size * 0.72, y + size * 0.05, x + dir * size * 0.52, y + size * 0.28);
        ctx.quadraticCurveTo(x + dir * size * 0.28, y + size * 0.06, x, y + size * 0.3);
    }
    ctx.fill();
    // ears
    ctx.beginPath();
    ctx.moveTo(x - size * 0.1, y - size * 0.05);
    ctx.lineTo(x - size * 0.08, y - size * 0.3);
    ctx.lineTo(x, y - size * 0.1);
    ctx.lineTo(x + size * 0.08, y - size * 0.3);
    ctx.lineTo(x + size * 0.1, y - size * 0.05);
    ctx.fill();
}

function drawFourPointStar(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number): void {
    ctx.beginPath();
    ctx.moveTo(x, y - radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.quadraticCurveTo(x, y, x, y + radius);
    ctx.quadraticCurveTo(x, y, x - radius, y);
    ctx.quadraticCurveTo(x, y, x, y - radius);
    ctx.fill();
}

// Sinterklaas' mitre (bishop's hat), drawn upright around (x, y) and tilted.
function drawMitre(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, tilt: number): void {
    const w = size * 0.5;
    const h = size * 0.62;
    ctx.translate(x, y);
    ctx.rotate(tilt);

    traceMitreOutline(ctx, w, h);
    ctx.fillStyle = '#d62828';
    ctx.fill();
    ctx.lineWidth = 1.2 * SCALE;
    ctx.strokeStyle = '#7a1212';
    ctx.stroke();

    ctx.save();
    traceMitreOutline(ctx, w, h);
    ctx.clip();
    // gold band up the middle and around the base
    ctx.fillStyle = '#f4c430';
    ctx.fillRect(-w * 0.14, -h, w * 0.28, h * 2);
    ctx.fillRect(-w * 1.2, h * 0.62, w * 2.4, h * 0.22);
    ctx.fillStyle = '#fff3c4';
    ctx.fillRect(-w * 1.2, h * 0.62, w * 2.4, h * 0.05);
    ctx.restore();

    // cross on the front
    ctx.fillStyle = '#f4c430';
    ctx.strokeStyle = '#7a1212';
    ctx.lineWidth = 0.8 * SCALE;
    const arm = w * 0.2;
    ctx.beginPath();
    ctx.rect(-arm * 0.35, -h * 0.5, arm * 0.7, arm * 2.6);
    ctx.rect(-arm * 1.15, -h * 0.5 + arm * 0.55, arm * 2.3, arm * 0.7);
    ctx.fill();
    ctx.stroke();

    // the two ribbons (infulae) hanging off the back
    ctx.fillStyle = '#f4c430';
    for (const dir of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(dir * w * 0.45, h * 0.84);
        ctx.lineTo(dir * w * 0.95, h * 1.35);
        ctx.lineTo(dir * w * 0.62, h * 1.38);
        ctx.lineTo(dir * w * 0.22, h * 0.86);
        ctx.closePath();
        ctx.fill();
    }
}

// Pointed-arch outline of the mitre, shared by the fill, stroke and clip.
function traceMitreOutline(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    ctx.beginPath();
    ctx.moveTo(-w, h * 0.84);
    ctx.quadraticCurveTo(-w * 1.08, -h * 0.15, 0, -h);
    ctx.quadraticCurveTo(w * 1.08, -h * 0.15, w, h * 0.84);
    ctx.closePath();
}

const painters: Record<CardDecorationEnum, Painter> = {
    [CardDecorationEnum.SNOWFALL]: (ctx, width, height) => {
        ctx.fillStyle = '#ffffff';
        const flakes = Math.round((width * height) / 15000);
        for (let i = 0; i < flakes; i++) {
            ctx.globalAlpha = rand(0.18, 0.65);
            ctx.beginPath();
            ctx.arc(rand(0, width), rand(0, height), rand(0.8, 2.6) * SCALE, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.strokeStyle = '#ffffff';
        ctx.lineCap = 'round';
        ctx.lineWidth = 1.2 * SCALE;
        for (let i = 0; i < 6; i++) {
            ctx.globalAlpha = rand(0.22, 0.4);
            // keep the big flakes toward the edges so they do not sit behind the text
            const x = Math.random() < 0.5 ? rand(0.01, 0.07) * width : rand(0.93, 0.99) * width;
            drawSnowflake(ctx, x, rand(0.1, 0.9) * height, rand(6, 11) * SCALE);
        }
    },

    [CardDecorationEnum.LIGHT_STRING]: (ctx, width) => {
        const swags = Math.max(2, Math.round(width / (190 * SCALE)));
        const swagWidth = width / swags;
        const sag = 15 * SCALE;
        const top = 3 * SCALE;
        const bulbsPerSwag = 4;

        ctx.lineWidth = 1.4 * SCALE;
        ctx.strokeStyle = 'rgba(10, 30, 20, 0.85)';
        ctx.beginPath();
        for (let s = 0; s < swags; s++) {
            ctx.moveTo(s * swagWidth, top);
            ctx.quadraticCurveTo(s * swagWidth + swagWidth / 2, top + sag, (s + 1) * swagWidth, top);
        }
        ctx.stroke();

        let colorIndex = 0;
        for (let s = 0; s < swags; s++) {
            const x0 = s * swagWidth;
            for (let k = 1; k <= bulbsPerSwag; k++) {
                const t = k / (bulbsPerSwag + 1);
                const x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * (x0 + swagWidth / 2) + t * t * (x0 + swagWidth);
                const y = (1 - t) * (1 - t) * top + 2 * (1 - t) * t * (top + sag) + t * t * top;
                const color = LIGHT_COLORS[colorIndex++ % LIGHT_COLORS.length];
                // the wide cards print the brand mark top right; keep the bulbs off it
                if (width > 500 * SCALE && x > width - 130 * SCALE)
                    continue;

                const glow = ctx.createRadialGradient(x, y + 7 * SCALE, 0, x, y + 7 * SCALE, 13 * SCALE);
                glow.addColorStop(0, color + '88');
                glow.addColorStop(1, color + '00');
                ctx.fillStyle = glow;
                ctx.fillRect(x - 14 * SCALE, y - 6 * SCALE, 28 * SCALE, 28 * SCALE);

                ctx.fillStyle = 'rgba(10, 30, 20, 0.9)';
                ctx.fillRect(x - 1.6 * SCALE, y, 3.2 * SCALE, 3 * SCALE);
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.ellipse(x, y + 7 * SCALE, 2.8 * SCALE, 4.2 * SCALE, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = 'rgba(255,255,255,0.55)';
                ctx.beginPath();
                ctx.ellipse(x - 0.9 * SCALE, y + 5.6 * SCALE, 0.8 * SCALE, 1.4 * SCALE, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    },

    [CardDecorationEnum.SNOW_DRIFT]: (ctx, width, height) => {
        const layers = [
            { rise: 9 * SCALE, wave: 3.5 * SCALE, freq: 0.011 / SCALE * 2, phase: 0.8, alpha: 0.5 },
            { rise: 5 * SCALE, wave: 2.5 * SCALE, freq: 0.017 / SCALE * 2, phase: 2.4, alpha: 0.85 },
        ];
        for (const layer of layers) {
            ctx.fillStyle = `rgba(240, 248, 255, ${layer.alpha})`;
            ctx.beginPath();
            ctx.moveTo(0, height);
            for (let x = 0; x <= width; x += 4 * SCALE)
                ctx.lineTo(x, height - layer.rise - Math.sin(x * layer.freq + layer.phase) * layer.wave);
            ctx.lineTo(width, height);
            ctx.closePath();
            ctx.fill();
        }
    },

    [CardDecorationEnum.COBWEB]: (ctx) => {
        const spokes = 6;
        const length = 105 * SCALE;
        const rings = [26, 52, 78, 104].map(r => r * SCALE);
        ctx.strokeStyle = 'rgba(255,255,255,0.26)';
        ctx.lineWidth = 1 * SCALE;
        ctx.lineCap = 'round';

        ctx.beginPath();
        for (let i = 0; i < spokes; i++) {
            const angle = (Math.PI / 2) * (i / (spokes - 1));
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
        }
        ctx.stroke();

        ctx.beginPath();
        for (const radius of rings) {
            for (let i = 0; i < spokes - 1; i++) {
                const a = (Math.PI / 2) * (i / (spokes - 1));
                const b = (Math.PI / 2) * ((i + 1) / (spokes - 1));
                const mid = (a + b) / 2;
                ctx.moveTo(Math.cos(a) * radius, Math.sin(a) * radius);
                // sag toward the corner, like a real web between two threads
                ctx.quadraticCurveTo(Math.cos(mid) * radius * 0.82, Math.sin(mid) * radius * 0.82, Math.cos(b) * radius, Math.sin(b) * radius);
            }
        }
        ctx.stroke();
    },

    [CardDecorationEnum.BATS]: (ctx, width, height) => {
        ctx.fillStyle = 'rgba(8, 4, 16, 0.7)';
        const spots = [
            { x: 0.58, y: 0.05, size: 15 },
            { x: 0.68, y: 0.11, size: 10 },
            { x: 0.93, y: 0.14, size: 12 },
            { x: 0.05, y: 0.93, size: 11 },
        ];
        for (const spot of spots)
            drawBat(ctx, spot.x * width, spot.y * height, spot.size * SCALE);
    },

    [CardDecorationEnum.MITRE]: (ctx, width) => {
        // top right, under the brand mark; smaller on narrow cards
        const size = (width > 500 * SCALE ? 34 : 24) * SCALE;
        const glow = ctx.createRadialGradient(width - 58 * SCALE, 52 * SCALE, 0, width - 58 * SCALE, 52 * SCALE, size * 1.5);
        glow.addColorStop(0, 'rgba(244, 196, 48, 0.28)');
        glow.addColorStop(1, 'rgba(244, 196, 48, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(width - 58 * SCALE - size * 1.5, 52 * SCALE - size * 1.5, size * 3, size * 3);
        drawMitre(ctx, width - 58 * SCALE, 52 * SCALE, size, 0.18);
    },

    [CardDecorationEnum.SPARKLES]: (ctx, width, height) => {
        const count = Math.round((width * height) / 90000);
        for (let i = 0; i < count; i++) {
            const x = rand(0, width);
            const y = rand(0, height);
            const radius = rand(4, 9) * SCALE;

            const glow = ctx.createRadialGradient(x, y, 0, x, y, radius * 2.2);
            glow.addColorStop(0, 'rgba(255, 214, 90, 0.35)');
            glow.addColorStop(1, 'rgba(255, 214, 90, 0)');
            ctx.fillStyle = glow;
            ctx.fillRect(x - radius * 2.2, y - radius * 2.2, radius * 4.4, radius * 4.4);

            ctx.globalAlpha = rand(0.55, 0.95);
            ctx.fillStyle = '#ffe08a';
            drawFourPointStar(ctx, x, y, radius);
        }
    },
};

export function drawCardDecorations(ctx: CanvasRenderingContext2D, width: number, height: number, decorations: CardDecorationEnum[]): void {
    for (const decoration of decorations) {
        ctx.save();
        painters[decoration](ctx, width, height);
        ctx.restore();
    }
}
