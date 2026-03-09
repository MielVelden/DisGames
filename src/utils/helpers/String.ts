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