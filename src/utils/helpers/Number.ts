export function formatNumber(n: number): string {
    return n.toLocaleString('en-US');
}

const ROMAN_NUMERALS: [value: number, symbol: string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
];

export function toRoman(n: number): string {
    if (!Number.isFinite(n) || n <= 0) return '';
    let remaining = Math.floor(n);
    let result = '';
    for (const [value, symbol] of ROMAN_NUMERALS) {
        while (remaining >= value) {
            result += symbol;
            remaining -= value;
        }
    }
    return result;
}