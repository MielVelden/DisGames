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
    // Replace all non-ASCII characters with '?', then normalize
    const asciiName = Array.from(str)
        .map(char => char.charCodeAt(0) <= 127 ? char : '?')
        .slice(0, maxLength)
        .join('')
        .trim()
        .replace(/\s+/g, ' ');
    return asciiName;
}