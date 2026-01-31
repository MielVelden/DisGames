export function isDate(value: any): value is Date {
    return value instanceof Date;
}

export function humanizeDate(date: Date): string {
    if(!date || isNaN(date.getTime()))
        return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}