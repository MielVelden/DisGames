import { REPOSITORY_CACHE_TTL } from "../../config";
import { durationToMilliseconds } from "../../utils/Duration";
import Logger from "../../utils/Logger";

interface BaseEntity {
  Id?: number;
}

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

interface QueryCacheEntry<T> {
  data: T[];
  expiry: number;
}

export class CacheManager<Model extends BaseEntity> {
  private cache: Map<number, CacheEntry<Model>> = new Map();
  private queryCache: Map<string, QueryCacheEntry<Model>> = new Map();
  private tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
    Logger.logDebug(`CacheManager initialized for table: ${tableName}`);
  }

  private isValidCacheEntry<T>(entry: CacheEntry<T>): boolean {
    return Date.now() < entry.expiry;
  }

  private isValidQueryCacheEntry<T>(entry: QueryCacheEntry<T>): boolean {
    return Date.now() < entry.expiry;
  }

  public setCacheEntry(id: number, data: Model): void {
    const expiry = Date.now() + durationToMilliseconds(REPOSITORY_CACHE_TTL);
    this.cache.set(id, { data, expiry });
  }

  public setQueryCacheEntry(queryHash: string, data: Model[]): void {
    const expiry = Date.now() + durationToMilliseconds(REPOSITORY_CACHE_TTL);
    this.queryCache.set(queryHash, { data, expiry });
  }

  public getCacheEntry(id: number): Model | null {
    const entry = this.cache.get(id);
    if (!entry)
      return null;
    
    if (!this.isValidCacheEntry(entry)) {
      this.cache.delete(id);
      return null;
    }
    
    return entry.data;
  }

  public getQueryCacheEntry(queryHash: string): Model[] | null {
    const entry = this.queryCache.get(queryHash);
    if (!entry)
      return null;
    
    if (!this.isValidQueryCacheEntry(entry)) {
      this.queryCache.delete(queryHash);
      return null;
    }
    
    return entry.data;
  }

  public generateQueryHash(query: string, params: any[]): string {
    // Create a hash from query string and parameters
    const queryData = {
      query: query,
      params: params
    };
    return btoa(JSON.stringify(queryData));
  }

  public invalidateCache(id: number): void {
    const existed = this.cache.has(id);
    this.cache.delete(id);
    
    if (existed)
      Logger.logDebug(`Cache INVALIDATE [${this.tableName}] ID: ${id}`);
  }

  public invalidateAllQueryCache(): void {
    this.queryCache.clear();
  }

  public clearAllCache(): void {
    this.cache.clear();
    this.queryCache.clear();
  }

  public getCacheStats(): { idCacheSize: number; queryCacheSize: number } {
    const stats = {
      idCacheSize: this.cache.size,
      queryCacheSize: this.queryCache.size
    };

    return stats;
  }
  
  public getDetailedStats(): {
    idCacheSize: number;
    queryCacheSize: number;
    expiredEntries: number;
    tableName: string;
  } {
    // Count expired entries without removing them
    let expiredCount = 0;
    const now = Date.now();
    
    for (const entry of this.cache.values()) {
      if (now >= entry.expiry) expiredCount++;
    }
    
    for (const entry of this.queryCache.values()) {
      if (now >= entry.expiry) expiredCount++;
    }
    
    const stats = {
      idCacheSize: this.cache.size,
      queryCacheSize: this.queryCache.size,
      expiredEntries: expiredCount,
      tableName: this.tableName
    };
    
    return stats;
  }
} 