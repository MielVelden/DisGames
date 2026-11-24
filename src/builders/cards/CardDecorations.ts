import { CanvasRenderingContext2D } from 'canvas';
import { CardDecorationEnum } from '../../interfaces/enums/application/CardDecorationEnum';
import { FONT_SANS, SCALE } from './CardTokens';

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


// x near the left or right edge, so motifs frame the content instead of sitting behind text
function edgeX(width: number): number {
    return Math.random() < 0.5 ? rand(0.01, 0.08) * width : rand(0.92, 0.99) * width;
}

// The wide cards print the brand mark top right; motifs along the top skip it.
function isUnderBrand(width: number, x: number): boolean {
    return width > 500 * SCALE && x > width - 130 * SCALE;
}

function drawLeaf(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number, color: string): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.bezierCurveTo(size * 0.75, -size * 0.55, size * 0.6, size * 0.45, 0, size * 0.8);
    ctx.bezierCurveTo(-size * 0.6, size * 0.45, -size * 0.75, -size * 0.55, 0, -size);
    ctx.fill();
    ctx.strokeStyle = 'rgba(60, 25, 5, 0.55)';
    ctx.lineWidth = 0.9 * SCALE;
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.8);
    ctx.lineTo(0, size * 1.1);
    for (const t of [-0.35, 0.05, 0.4]) {
        ctx.moveTo(0, t * size);
        ctx.lineTo(size * 0.32, (t - 0.28) * size);
        ctx.moveTo(0, t * size);
        ctx.lineTo(-size * 0.32, (t - 0.28) * size);
    }
    ctx.stroke();
    ctx.restore();
}

function traceHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    ctx.beginPath();
    ctx.moveTo(x, y + size * 0.35);
    ctx.bezierCurveTo(x - size * 1.1, y - size * 0.35, x - size * 0.45, y - size * 1.05, x, y - size * 0.45);
    ctx.bezierCurveTo(x + size * 0.45, y - size * 1.05, x + size * 1.1, y - size * 0.35, x, y + size * 0.35);
    ctx.closePath();
}

function drawShamrock(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number, color: string): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.fillStyle = color;
    // three heart-shaped leaves (two round lobes and a point at the centre)
    const lobe = size * 0.3;
    for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.rotate((Math.PI * 2 / 3) * i);
        ctx.beginPath();
        ctx.arc(-lobe * 0.85, -size * 0.62, lobe, 0, Math.PI * 2);
        ctx.arc(lobe * 0.85, -size * 0.62, lobe, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-lobe * 1.75, -size * 0.5);
        ctx.lineTo(lobe * 1.75, -size * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.lineWidth = size * 0.1;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(size * 0.2, size * 0.8, size * 0.55, size * 1.2);
    ctx.stroke();
    ctx.restore();
}

function drawEgg(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, tilt: number, base: string, band: string): void {
    const w = size * 0.72;
    const h = size;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt);
    ctx.beginPath();
    ctx.moveTo(0, -h);
    ctx.bezierCurveTo(w, -h, w, h * 0.75, 0, h * 0.75);
    ctx.bezierCurveTo(-w, h * 0.75, -w, -h, 0, -h);
    ctx.closePath();
    ctx.fillStyle = base;
    ctx.fill();

    ctx.save();
    ctx.clip();
    // zigzag band across the middle, and a thin stripe above it
    ctx.fillStyle = band;
    ctx.beginPath();
    const teeth = 6;
    ctx.moveTo(-w, -h * 0.05);
    for (let i = 0; i <= teeth; i++)
        ctx.lineTo(-w + (2 * w * i) / teeth, i % 2 === 0 ? -h * 0.05 : -h * 0.22);
    for (let i = teeth; i >= 0; i--)
        ctx.lineTo(-w + (2 * w * i) / teeth, i % 2 === 0 ? h * 0.18 : h * 0.01);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(-w, -h * 0.5, 2 * w, h * 0.08);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.ellipse(-w * 0.32, -h * 0.45, w * 0.14, h * 0.22, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.lineWidth = 0.8 * SCALE;
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.stroke();
    ctx.restore();
}

function drawLantern(ctx: CanvasRenderingContext2D, x: number, top: number, drop: number, size: number): void {
    const w = size * 0.62;
    const h = size * 0.5;
    const cy = top + drop + h;

    ctx.strokeStyle = 'rgba(244, 196, 48, 0.75)';
    ctx.lineWidth = 1 * SCALE;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, cy - h);
    ctx.stroke();

    const glow = ctx.createRadialGradient(x, cy, 0, x, cy, size * 1.4);
    glow.addColorStop(0, 'rgba(255, 90, 60, 0.35)');
    glow.addColorStop(1, 'rgba(255, 90, 60, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - size * 1.4, cy - size * 1.4, size * 2.8, size * 2.8);

    const body = ctx.createRadialGradient(x - w * 0.25, cy - h * 0.3, 0, x, cy, w * 1.1);
    body.addColorStop(0, '#ff5a3c');
    body.addColorStop(1, '#a8100f');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(x, cy, w, h, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(110, 8, 8, 0.7)';
    ctx.lineWidth = 0.9 * SCALE;
    ctx.beginPath();
    for (const f of [-0.6, -0.25, 0.25, 0.6]) {
        ctx.moveTo(x, cy - h);
        ctx.quadraticCurveTo(x + f * w * 1.5, cy, x, cy + h);
    }
    ctx.stroke();

    ctx.fillStyle = '#f4c430';
    ctx.fillRect(x - w * 0.42, cy - h - size * 0.08, w * 0.84, size * 0.12);
    ctx.fillRect(x - w * 0.42, cy + h - size * 0.04, w * 0.84, size * 0.12);

    ctx.strokeStyle = '#f4c430';
    ctx.lineWidth = 0.9 * SCALE;
    ctx.beginPath();
    for (const dx of [-0.12, -0.04, 0.04, 0.12]) {
        ctx.moveTo(x + dx * w, cy + h + size * 0.08);
        ctx.lineTo(x + dx * w * 1.4, cy + h + size * 0.42);
    }
    ctx.stroke();
}

function drawFireworkBurst(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string): void {
    const glow = ctx.createRadialGradient(x, y, 0, x, y, radius * 1.3);
    glow.addColorStop(0, color + '55');
    glow.addColorStop(1, color + '00');
    ctx.fillStyle = glow;
    ctx.fillRect(x - radius * 1.3, y - radius * 1.3, radius * 2.6, radius * 2.6);

    const rays = 16;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineCap = 'round';
    ctx.lineWidth = 1.3 * SCALE;
    for (let i = 0; i < rays; i++) {
        const angle = (Math.PI * 2 * i) / rays + rand(-0.06, 0.06);
        const inner = radius * 0.25;
        const outer = radius * rand(0.8, 1);
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(angle) * inner, y + Math.sin(angle) * inner);
        ctx.lineTo(x + Math.cos(angle) * outer, y + Math.sin(angle) * outer);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x + Math.cos(angle) * (outer + 2.5 * SCALE), y + Math.sin(angle) * (outer + 2.5 * SCALE), 1.5 * SCALE, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

const CONFETTI_COLORS = ['#ff4d6d', '#ffd166', '#06d6a0', '#4cc9f0', '#f8f9fa', '#b388ff'];
const BUNTING_COLORS = ['#e63946', '#ffd60a', '#2a9d4b', '#f8f9fa'];
const FIREWORK_COLORS = ['#ffd166', '#ff6b9a', '#6fe3ff', '#c3ff7a'];
const LEAF_COLORS = ['#c0392b', '#d35400', '#e67e22', '#f1c40f', '#a0522d'];
const EGG_COLORS: [string, string][] = [['#ffb3c6', '#ff6f91'], ['#bde0fe', '#5aa9e6'], ['#fff3b0', '#f4a261'], ['#caffbf', '#52b788'], ['#e0c3fc', '#9d4edd']];

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

    [CardDecorationEnum.FALLING_LEAVES]: (ctx, width, height) => {
        for (let i = 0; i < 12; i++) {
            ctx.globalAlpha = rand(0.5, 0.85);
            const color = LEAF_COLORS[i % LEAF_COLORS.length];
            drawLeaf(ctx, edgeX(width), rand(0.05, 0.95) * height, rand(6, 11) * SCALE, rand(0, Math.PI * 2), color);
        }
        // a few drifting along the top band
        for (let i = 0; i < 4; i++) {
            const x = rand(0.15, 0.8) * width;
            ctx.globalAlpha = rand(0.35, 0.6);
            drawLeaf(ctx, x, rand(0.03, 0.14) * height, rand(5, 8) * SCALE, rand(0, Math.PI * 2), LEAF_COLORS[(i + 2) % LEAF_COLORS.length]);
        }
    },

    [CardDecorationEnum.PRICE_TAG]: (ctx, width) => {
        const size = (width > 500 * SCALE ? 30 : 22) * SCALE;
        // top right, below the brand mark
        const cx = width - 60 * SCALE;
        const cy = 62 * SCALE;
        ctx.translate(cx, cy);
        ctx.rotate(-0.35);

        const w = size * 1.5;
        const h = size;
        // short loop of string through the hole
        ctx.strokeStyle = 'rgba(244, 196, 48, 0.8)';
        ctx.lineWidth = 1.2 * SCALE;
        ctx.beginPath();
        ctx.moveTo(-w * 0.55, 0);
        ctx.bezierCurveTo(-w * 1.1, -h * 0.2, -w * 1.2, h * 0.6, -w * 0.85, h * 0.9);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-w * 0.8, 0);
        ctx.lineTo(-w * 0.45, -h / 2);
        ctx.lineTo(w * 0.6, -h / 2);
        ctx.lineTo(w * 0.6, h / 2);
        ctx.lineTo(-w * 0.45, h / 2);
        ctx.closePath();
        ctx.fillStyle = '#f4c430';
        ctx.fill();
        ctx.strokeStyle = '#8a6a00';
        ctx.lineWidth = 1 * SCALE;
        ctx.stroke();

        ctx.fillStyle = '#0d0d0d';
        ctx.beginPath();
        ctx.arc(-w * 0.55, 0, size * 0.1, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = `900 ${size * 0.72}px ${FONT_SANS}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('%', w * 0.1, size * 0.04);
    },

    [CardDecorationEnum.FIREWORKS]: (ctx, width, height) => {
        const wide = width > 500 * SCALE;
        const bursts = [
            { x: 0.06, y: 0.16, r: 26 },
            { x: wide ? 0.62 : 0.8, y: 0.1, r: 20 },
            { x: 0.36, y: 0.07, r: 14 },
            { x: 0.95, y: 0.88, r: 22 },
            { x: 0.04, y: 0.86, r: 16 },
        ];
        bursts.forEach((burst, i) => drawFireworkBurst(ctx, burst.x * width, burst.y * height, burst.r * SCALE, FIREWORK_COLORS[i % FIREWORK_COLORS.length]));
    },

    [CardDecorationEnum.CONFETTI]: (ctx, width, height) => {
        const pieces = Math.round((width * height) / 9000);
        for (let i = 0; i < pieces; i++) {
            ctx.save();
            ctx.globalAlpha = rand(0.45, 0.9);
            ctx.fillStyle = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
            ctx.translate(rand(0, width), rand(0, height));
            ctx.rotate(rand(0, Math.PI));
            if (i % 3 === 0) {
                ctx.beginPath();
                ctx.arc(0, 0, rand(1.2, 2.2) * SCALE, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillRect(-2.5 * SCALE, -1.2 * SCALE, 5 * SCALE, 2.4 * SCALE);
            }
            ctx.restore();
        }
    },

    [CardDecorationEnum.HEARTS]: (ctx, width, height) => {
        const colors = ['#ff4d6d', '#ff8fab', '#c9184a', '#ffccd5'];
        for (let i = 0; i < 14; i++) {
            const x = edgeX(width);
            const y = rand(0.06, 0.94) * height;
            const size = rand(5, 12) * SCALE;
            ctx.globalAlpha = rand(0.4, 0.85);
            ctx.fillStyle = colors[i % colors.length];
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rand(-0.4, 0.4));
            traceHeart(ctx, 0, 0, size);
            ctx.fill();
            ctx.restore();
        }
        for (let i = 0; i < 5; i++) {
            const x = rand(0.12, 0.8) * width;
            if (isUnderBrand(width, x))
                continue;
            ctx.globalAlpha = rand(0.3, 0.55);
            ctx.fillStyle = colors[(i + 1) % colors.length];
            traceHeart(ctx, x, rand(0.06, 0.15) * height, rand(4, 7) * SCALE);
            ctx.fill();
        }
    },

    [CardDecorationEnum.LANTERNS]: (ctx, width) => {
        const wide = width > 500 * SCALE;
        const lanterns = [
            { x: 0.05, drop: 4, size: 26 },
            { x: 0.15, drop: 14, size: 20 },
            { x: 0.27, drop: 2, size: 16 },
            { x: wide ? 0.66 : 0.82, drop: 8, size: 18 },
        ];
        for (const lantern of lanterns)
            drawLantern(ctx, lantern.x * width, 0, lantern.drop * SCALE, lantern.size * SCALE);
    },

    [CardDecorationEnum.BUNTING]: (ctx, width) => {
        const swags = Math.max(2, Math.round(width / (190 * SCALE)));
        const swagWidth = width / swags;
        const sag = 14 * SCALE;
        const top = 2 * SCALE;
        const flagsPerSwag = 5;
        const flagWidth = 13 * SCALE;
        const flagHeight = 16 * SCALE;

        ctx.lineWidth = 1.2 * SCALE;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        for (let s = 0; s < swags; s++) {
            ctx.moveTo(s * swagWidth, top);
            ctx.quadraticCurveTo(s * swagWidth + swagWidth / 2, top + sag, (s + 1) * swagWidth, top);
        }
        ctx.stroke();

        let colorIndex = 0;
        for (let s = 0; s < swags; s++) {
            const x0 = s * swagWidth;
            for (let k = 1; k <= flagsPerSwag; k++) {
                const t = k / (flagsPerSwag + 1);
                const x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * (x0 + swagWidth / 2) + t * t * (x0 + swagWidth);
                const y = (1 - t) * (1 - t) * top + 2 * (1 - t) * t * (top + sag) + t * t * top;
                const color = BUNTING_COLORS[colorIndex++ % BUNTING_COLORS.length];
                if (isUnderBrand(width, x))
                    continue;
                ctx.globalAlpha = 0.9;
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.moveTo(x - flagWidth / 2, y);
                ctx.lineTo(x + flagWidth / 2, y);
                ctx.lineTo(x, y + flagHeight);
                ctx.closePath();
                ctx.fill();
            }
        }
    },

    [CardDecorationEnum.SHAMROCKS]: (ctx, width, height) => {
        const colors = ['#2ecc71', '#27ae60', '#7bed9f', '#1e8449'];
        for (let i = 0; i < 10; i++) {
            ctx.globalAlpha = rand(0.55, 0.9);
            drawShamrock(ctx, edgeX(width), rand(0.06, 0.94) * height, rand(10, 16) * SCALE, rand(-0.6, 0.6), colors[i % colors.length]);
        }
        for (let i = 0; i < 4; i++) {
            const x = rand(0.15, 0.8) * width;
            if (isUnderBrand(width, x))
                continue;
            ctx.globalAlpha = rand(0.4, 0.6);
            drawShamrock(ctx, x, rand(0.06, 0.12) * height, rand(7, 10) * SCALE, rand(-0.6, 0.6), colors[(i + 1) % colors.length]);
        }
    },

    [CardDecorationEnum.EASTER_EGGS]: (ctx, width, height) => {
        // tufts of grass along the bottom, with a nest of eggs in each bottom corner
        ctx.strokeStyle = 'rgba(120, 200, 110, 0.75)';
        ctx.lineCap = 'round';
        ctx.lineWidth = 1.4 * SCALE;
        ctx.beginPath();
        for (let x = 0; x <= width; x += 5 * SCALE) {
            const blade = rand(4, 10) * SCALE;
            ctx.moveTo(x, height);
            ctx.quadraticCurveTo(x + rand(-2, 2) * SCALE, height - blade * 0.6, x + rand(-3, 3) * SCALE, height - blade);
        }
        ctx.stroke();

        const nests = [
            { x: 0.04, eggs: [{ dx: 0, dy: -30, s: 22, t: -0.2 }, { dx: 26, dy: -18, s: 15, t: 0.25 }] },
            { x: 0.94, eggs: [{ dx: 0, dy: -30, s: 22, t: 0.2 }, { dx: -28, dy: -18, s: 15, t: -0.3 }, { dx: 20, dy: -13, s: 12, t: 0.4 }] },
        ];
        let colorIndex = 0;
        for (const nest of nests) {
            for (const egg of nest.eggs) {
                const [base, band] = EGG_COLORS[colorIndex++ % EGG_COLORS.length];
                ctx.globalAlpha = 0.95;
                drawEgg(ctx, nest.x * width + egg.dx * SCALE, height + egg.dy * SCALE, egg.s * SCALE, egg.t, base, band);
            }
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
