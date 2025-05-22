export type Duration = number;

export enum DurationEnum {
    MINUTE = 60,
    HOUR = 3600,
    DAY = 86400,
    WEEK = 604800,
}

export function calculateDuration(value: number, duration: DurationEnum): Duration {
    return value * duration;
}