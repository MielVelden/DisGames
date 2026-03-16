export interface HitMissProvider {
    getHitMissStats(): { hits: number; misses: number };
}

export interface AggregatedCacheStats {
    hits: number;
    misses: number;
    totalRequests: number;
    hitRatePercent: number;
}