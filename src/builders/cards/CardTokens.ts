import { Color } from '../../utils/helpers/Color';

export const SCALE = 2;
export const FONT_SANS = 'Inter, Arial, sans-serif';
export const FONT_MONO = 'JetBrains Mono, Consolas, monospace';

export interface ColorPack {
    deep: Color;
    base: Color;
    mid: Color;
    accent: Color;
    accent2: Color;
}

export const COLOR_PACK: ColorPack = {
    deep: '#1a1742',
    base: '#27245C',
    mid: '#312898',
    accent: '#D938C8',
    accent2: '#7C3BFF'
};

export const COLOR_TEXT = '#f3eefe';
export const COLOR_TEXT_MUTED = '#a5a0c9';
export const COLOR_TEXT_FAINT = '#6b67a0';
export const COLOR_PANEL = 'rgba(0,0,0,0.18)';
export const COLOR_PANEL_BORDER = 'rgba(255,255,255,0.06)';
export const COLOR_CHIP_BG = 'rgba(255,255,255,0.04)';
export const COLOR_CHIP_BORDER = 'rgba(255,255,255,0.06)';
export const COLOR_DIVIDER = 'rgba(255,255,255,0.06)';
export const COLOR_DIVIDER_STRONG = 'rgba(255,255,255,0.10)';
export const COLOR_PROGRESS_TRACK = 'rgba(0,0,0,0.4)';

export const CARD_RADIUS = 18 * SCALE;
export const CARD_BORDER_COLOR = 'rgba(255,255,255,0.08)';
export const BRAND_TOP = 14 * SCALE;
export const BRAND_RIGHT = 16 * SCALE;
