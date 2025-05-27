export type Duration = number;

export enum DurationEnum {
    SECOND = 1,
    MINUTE = 60,
    HOUR = 3600,
    DAY = 86400,
    WEEK = 604800,
}

export function calculateDuration(value: number, duration: DurationEnum): Duration {
    return value * duration;
}

export function durationToMilliseconds(duration: Duration): number {
    return duration * 1000;
}