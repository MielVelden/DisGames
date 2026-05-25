import humanizeDurationMs from "humanize-duration";

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDate(date: Date, includeDate: boolean = true): string {
    if (!date || isNaN(date.getTime()))
        return "Unknown";

    if (includeDate)
        return `${MONTHS_SHORT[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    
    return `${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

export function isDate(value: any): value is Date {
    return value instanceof Date;
}

export function humanizeDate(date: Date): string {
    if(!date || isNaN(date.getTime()))
        return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function humanizeDateFromNow(date: Date): string {
    if (!date || isNaN(date.getTime())) 
        return "unknown";
    
    const diff = Date.now() - date.getTime();
    return humanizeDurationMs(Math.abs(diff), { language: "en", largest: 1, round: true }) + (diff >= 0 ? " ago" : " from now");
}