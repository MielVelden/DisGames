import { Duration, DurationEnum, DurationGranularityEnum } from "../../interfaces/application/Duration";
import humanizeDurationMs from "humanize-duration";

type HumanizeUnit = "y" | "mo" | "w" | "d" | "h" | "m" | "s" | "ms";

const UNITS_BY_GRANULARITY: Record<DurationGranularityEnum, readonly HumanizeUnit[]> = {
    [DurationGranularityEnum.YEAR]: ["y"],
    [DurationGranularityEnum.MONTH]: ["y", "mo"],
    [DurationGranularityEnum.WEEK]: ["y", "mo", "w"],
    [DurationGranularityEnum.DAY]: ["y", "mo", "w", "d"],
    [DurationGranularityEnum.HOUR]: ["y", "mo", "w", "d", "h"],
    [DurationGranularityEnum.MINUTE]: ["y", "mo", "w", "d", "h", "m"],
    [DurationGranularityEnum.SECOND]: ["y", "mo", "w", "d", "h", "m", "s"],
    [DurationGranularityEnum.MILLISECOND]: ["y", "mo", "w", "d", "h", "m", "s", "ms"],
};

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

export function humanizeDuration(
    duration: Duration,
    granularity: DurationGranularityEnum = DurationGranularityEnum.SECOND,
): string {
    return humanizeDurationMs(durationToMilliseconds(duration), {
        language: "en",
        units: [...UNITS_BY_GRANULARITY[granularity]],
    });
}