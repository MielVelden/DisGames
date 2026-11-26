import humanizeDurationMs from "humanize-duration";

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDate(date: Date, includeDate: boolean = true): string {
    if (!date || isNaN(date.getTime()))
        return "Unknown";

    if (includeDate)
        return `${MONTHS_SHORT[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;

    return `${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

// A calendar day without a year, for recurring annual dates (month is 1-12).
export interface MonthDay {
    month: number;
    day: number;
}

export function toMonthDay(date: Date): MonthDay {
    return { month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

function monthDayOrdinal(value: MonthDay): number {
    return value.month * 100 + value.day;
}

export function isWithinMonthDayRange(date: Date, from: MonthDay, to: MonthDay): boolean {
    const today = monthDayOrdinal(toMonthDay(date));
    const start = monthDayOrdinal(from);
    const end = monthDayOrdinal(to);
    return start <= end
        ? today >= start && today <= end
        : today >= start || today <= end;
}

export function isDate(value: any): value is Date {
    return value instanceof Date;
}

export function humanizeDate(date: Date): string {
    if (!date || isNaN(date.getTime()))
        return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function humanizeDateFromNow(date: Date): string {
    if (!date || isNaN(date.getTime()))
        return "unknown";

    const diff = Date.now() - date.getTime();
    return humanizeDurationMs(Math.abs(diff), { language: "en", largest: 1, round: true }) + (diff >= 0 ? " ago" : " from now");
}