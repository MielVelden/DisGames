import { AggregatedCacheStats, HitMissProvider } from "../../interfaces/application/Cache";

class CacheRegistry {
  private static readonly instances: HitMissProvider[] = [];

  public static register(instance: HitMissProvider): void {
    this.instances.push(instance);
  }

  public static getAggregateStats(): AggregatedCacheStats {
    let hits = 0;
    let misses = 0;

    for (const instance of this.instances) {
      const stats = instance.getHitMissStats();
      hits += stats.hits;
      misses += stats.misses;
    }

    const totalRequests = hits + misses;
    const hitRatePercent = totalRequests > 0
      ? Math.round((hits / totalRequests) * 1000) / 10
      : 0;

    return {
      hits,
      misses,
      totalRequests,
      hitRatePercent
    };
  }
}

export default CacheRegistry;
