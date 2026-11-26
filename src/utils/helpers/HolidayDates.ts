import { MonthDay } from "./Date";

// Calendar maths for holidays whose date moves every year. Everything is UTC and
// returns a MonthDay, so the results plug straight into a StyleWindow.

function toMonthDayUtc(year: number, month: number, day: number): MonthDay {
    const date = new Date(Date.UTC(year, month - 1, day));
    return { month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

// Moves a day by `days` (negative goes back), rolling over month ends.
export function shiftMonthDay(year: number, value: MonthDay, days: number): MonthDay {
    return toMonthDayUtc(year, value.month, value.day + days);
}

// Western (Gregorian) Easter Sunday: the anonymous Gregorian computus (Meeus/Jones/Butcher).
export function easterSunday(year: number): MonthDay {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return { month, day };
}

// The nth `weekday` (0 = Sunday … 6 = Saturday) of a month, e.g. the 4th Thursday of November.
export function nthWeekdayOfMonth(year: number, month: number, weekday: number, n: number): MonthDay {
    const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
    const offset = (weekday - firstWeekday + 7) % 7;
    return { month, day: 1 + offset + (n - 1) * 7 };
}

// US Thanksgiving: the 4th Thursday of November.
export function thanksgiving(year: number): MonthDay {
    return nthWeekdayOfMonth(year, 11, 4, 4);
}

// Lunisolar, so a table rather than a formula. Extend it before 2041.
const LUNAR_NEW_YEAR: Record<number, MonthDay> = {
    2025: { month: 1, day: 29 },
    2026: { month: 2, day: 17 },
    2027: { month: 2, day: 6 },
    2028: { month: 1, day: 26 },
    2029: { month: 2, day: 13 },
    2030: { month: 2, day: 3 },
    2031: { month: 1, day: 23 },
    2032: { month: 2, day: 11 },
    2033: { month: 1, day: 31 },
    2034: { month: 2, day: 19 },
    2035: { month: 2, day: 8 },
    2036: { month: 1, day: 28 },
    2037: { month: 2, day: 15 },
    2038: { month: 2, day: 4 },
    2039: { month: 1, day: 24 },
    2040: { month: 2, day: 12 },
};

// Undefined for a year outside the table; the preset is then simply inactive.
export function lunarNewYear(year: number): MonthDay | undefined {
    return LUNAR_NEW_YEAR[year];
}
