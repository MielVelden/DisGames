export const DEFAULT_EMBED_COLOR = getColorFromHex('#ee3ac5');

function getColorFromHex(hex: string): number {
    return parseInt(hex.replace('#', ''), 16);
}