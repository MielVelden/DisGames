import { REPOSITORY_CACHE_TTL } from "../../constants";
import { durationToMilliseconds } from "../../utils/helpers/Duration";
import Logger from "../../utils/application/Logger";
import { BaseEntity } from "../../interfaces/database/BaseEntity";
import CacheRegistry from "./CacheRegistry";

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
  private inFlightQueries: Map<string, Promise<Model[]>> = new Map();
  private tableName: string;
  private hits: number = 0;
  private misses: number = 0;

  constructor(tableName: string) {
    this.tableName = tableName;
    Logger.logDebug(`CacheManager initialized for table: ${tableName}`);
    CacheRegistry.register(this);
  }

  private isValidCacheEntry<T>(entry: CacheEntry<T>): boolean {
    return Date.now() < entry.expiry;
  }

  private isValidQueryCacheEntry<T>(entry: QueryCacheEntry<T>): boolean {
    return Date.now() < entry.expiry;
  }

  public setCacheEntry(id: number, data: Model): void {
    const expiry = Date.now() + durationToMilliseconds(REPOSITORY_CACHE_TTL);
    this.cache.set(id, { data: structuredClone(data), expiry });
  }

  public setQueryCacheEntry(queryHash: string, data: Model[]): void {
    const expiry = Date.now() + durationToMilliseconds(REPOSITORY_CACHE_TTL);
    this.queryCache.set(queryHash, { data: structuredClone(data), expiry });
  }

  public getCacheEntry(id: number): Model | null {
    const entry = this.cache.get(id);
    if (!entry) {
      this.misses++;
      return null;
    }

    if (!this.isValidCacheEntry(entry)) {
      this.cache.delete(id);
      this.misses++;
      return null;
    }

    this.hits++;
    return structuredClone(entry.data);
  }

  public getQueryCacheEntry(queryHash: string): Model[] | null {
    const entry = this.queryCache.get(queryHash);
    if (!entry) {
      this.misses++;
      return null;
    }

    if (!this.isValidQueryCacheEntry(entry)) {
      this.queryCache.delete(queryHash);
      this.misses++;
      return null;
    }

    this.hits++;
    Logger.logDebug(`Cache HIT [${this.tableName}] - Returning cached query result`);
    return structuredClone(entry.data);
  }

  public getHitMissStats(): { hits: number; misses: number } {
    return { hits: this.hits, misses: this.misses };
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
    this.inFlightQueries.clear();
  }

  public clearAllCache(): void {
    this.cache.clear();
    this.queryCache.clear();
    this.inFlightQueries.clear();
  }

  public getInFlightQuery(queryHash: string): Promise<Model[]> | null {
    return this.inFlightQueries.get(queryHash) || null;
  }

  public setInFlightQuery(queryHash: string, promise: Promise<Model[]>): void {
    this.inFlightQueries.set(queryHash, promise);
  }

  public removeInFlightQuery(queryHash: string): void {
    this.inFlightQueries.delete(queryHash);
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