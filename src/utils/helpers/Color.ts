export type Color = `#${string}` | `rgba(${string})` | 'transparent';

/**
 * Shifts a #rrggbb color toward white (percent > 0) or black (percent < 0).
 * percent is in [-1, 1].
 */
export function shadeColor(hex: string, percent: number): Color {
    const num = parseInt(hex.slice(1), 16);
    let r = (num >> 16) & 0xff;
    let g = (num >> 8) & 0xff;
    let b = num & 0xff;

    if (percent >= 0) {
        r = Math.round(r + (255 - r) * percent);
        g = Math.round(g + (255 - g) * percent);
        b = Math.round(b + (255 - b) * percent);
    } else {
        const p = 1 + percent;
        r = Math.round(r * p);
        g = Math.round(g * p);
        b = Math.round(b * p);
    }

    const toHex = (v: number) => v.toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
