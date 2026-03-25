export type Duration = number;

export enum DurationGranularityEnum {
    YEAR = "YEAR",
    MONTH = "MONTH",
    WEEK = "WEEK",
    DAY = "DAY",
    HOUR = "HOUR",
    MINUTE = "MINUTE",
    SECOND = "SECOND",
    MILLISECOND = "MILLISECOND",
}

export enum DurationEnum {
    SECOND = 1,
    MINUTE = 60,
    HOUR = 3600,
    DAY = 86400,
    WEEK = 604800,
}