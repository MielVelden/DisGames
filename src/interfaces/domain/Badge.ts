import { BadgeEnum, BadgeTriggerEnum } from "../enums";

// Narrow, declared stats surface a badge is allowed to read.
// Getters are async + lazily cached by the factory, so a badge that needs
// only one field never triggers fetches for the others. Widen this interface
// deliberately when a badge needs new data — never leak the raw event into badges.
export interface BadgeContext {
    readonly userId: string;
    readonly guildId: string;
    readonly trigger: BadgeTriggerEnum;
    streakDays(): Promise<number>;
    totalPoints(): Promise<number>;
    gamesPlayed(): Promise<number>;
    accountAgeDays(): Promise<number>;
    distinctServers(): Promise<number>;
}

export interface BadgeTier {
    level: number;
    threshold: number;
}

export interface BadgeConfig {
    id: BadgeEnum;
    triggers: BadgeTriggerEnum[];
    tiers: BadgeTier[];
}

export interface BadgeResult {
    achievement: BadgeEnum;
    level: number;
    isNew: boolean;
}

// A badge is a pure function over the stats snapshot: given the context,
// return the highest tier the user qualifies for right now, or null.
// It knows nothing about history, persistence, or Discord.
export interface BadgeModule {
    config: BadgeConfig;
    evaluate(ctx: BadgeContext): Promise<number | null>;
}

// Shared helper so each badge file doesn't re-implement "highest tier reached".
// Assumes tiers are listed in ascending threshold order.
export function highestTier(tiers: BadgeTier[], value: number): number | null {
    let earned: number | null = null;
    for (const tier of tiers)
        if (value >= tier.threshold)
            earned = tier.level;
    return earned;
}
