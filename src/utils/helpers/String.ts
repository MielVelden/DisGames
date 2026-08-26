export function compareStrings(str1: string, str2: string): boolean {
    const normalize = (str: string) =>
        str
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, ' ')
            .trim();

    return normalize(str1) === normalize(str2);
}

export function normalizeString(str: string, maxLength: number = 25): string {
    const isStrippable = (codePoint: number) =>
        codePoint <= 0x1f
        || codePoint === 0x7f
        || (codePoint >= 0x200b && codePoint <= 0x200f)
        || (codePoint >= 0x202a && codePoint <= 0x202e);

    return Array.from(str)
        .filter(char => !isStrippable(char.codePointAt(0)!))
        .slice(0, maxLength)
        .join('')
        .trim()
        .replace(/\s+/g, ' ');
}

export function getInitials(displayName: string | null | undefined): string {
    const cleaned = (displayName ?? '').replace(/[^A-Za-z0-9]/g, '');
    return (cleaned.slice(0, 2) || '?').toUpperCase();
}