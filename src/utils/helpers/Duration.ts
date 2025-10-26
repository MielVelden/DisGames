import { Duration, DurationEnum } from "../../interfaces/application/Duration";

export function calculateDuration(value: number, duration: DurationEnum): Duration {
    return value * duration;
}

export function durationToMilliseconds(duration: Duration): number {
    return duration * 1000;
}

export function addDurationToDate(duration: Duration, timeStamp: Date): Date {
    return new Date(timeStamp.getTime() + durationToMilliseconds(duration));
}

export function subtractDurationFromDate(duration: Duration, timeStamp: Date): Date {
    return new Date(timeStamp.getTime() - durationToMilliseconds(duration));
}