import { TableEnum, StoredProcedureEnum } from "../interfaces/enums/index";
import { FunctionEnum } from "../interfaces/enums/database/FunctionEnum";
import { getTableName, runQueryAsync } from "./util/ConnectionHandler";
import { DatabaseHelper } from "../utils/database/DatabaseHelper";
import { CacheManager } from "./util/CacheManager";

type Condition<T> = (x: T) => any;
type QueryCondition = string | { [key: string]: any };

interface BaseEntity {
  Id?: number;
}

class BaseRepository<Model extends BaseEntity, SaveModel extends BaseEntity> {
  protected tableEnum: TableEnum;
  protected table: string;
  protected query: string = '';
  protected params: any[] = [];
  protected cacheManager: CacheManager<Model>;
  protected hasLimit1: boolean = false;

  constructor(table: TableEnum) {
    this.tableEnum = table;
    this.table = getTableName(table);
    this.cacheManager = new CacheManager<Model>(this.table);
  }

  public async getById(id: number): Promise<Model | null> {
    // Check cache first
    const cached = this.cacheManager.getCacheEntry(id);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const results = await this.Select().Where({ Id: id }).Limit(1).Execute();
    const result = results?.[0] || null;
    
    // Cache the result if found
    if (result) {
      this.cacheManager.setCacheEntry(id, result);
    }
    
    return result;
  }

  public Select(fields: (keyof Model)[] = ['*'] as (keyof Model)[]): BaseRepository<Model, SaveModel> {
    this.params = [];
    this.hasLimit1 = false;
    this.query = `SELECT ${fields.join(', ')} FROM ${this.table}`;
    return this;
  }

  public Where<K extends keyof Model>(condition: Partial<Record<K, Model[K]>>): this {
    const conditions = Object.entries(condition)
      .map(([key]) => `${key} = ?`)
      .join(' AND ');

    this.query += ` WHERE ${conditions}`;
    this.params.push(...Object.values(condition));

    return this;
  }

  public GroupBy<K extends keyof Model>(fields: K[]): this {
    const conditions = fields.map((field) => `${String(field)}`).join(', ');

    this.query += ` GROUP BY ${conditions}`;
    return this;
  }

  public OrderBy(field: keyof Model, direction: 'ASC' | 'DESC' = 'ASC'): BaseRepository<Model, SaveModel> {
    this.query += ` ORDER BY ${String(field)} ${direction}`;
    return this;
  }

  public OrderByRandom(): BaseRepository<Model, SaveModel> {
    this.query += ` ORDER BY RAND()`;
    return this;
  }

  public Limit(count: number): BaseRepository<Model, SaveModel> {
    this.query += ` LIMIT ?`;
    this.params.push(count);
    
    // Track if this is a LIMIT 1 query for caching
    if (count === 1) {
      this.hasLimit1 = true;
    }
    
    return this;
  }

  public Offset(count: number): BaseRepository<Model, SaveModel> {
    this.query += ` OFFSET ?`;
    this.params.push(count);
    return this;
  }

  public async Execute(): Promise<Model[]> {
    // Check query cache for LIMIT 1 queries
    if (this.hasLimit1) {
      const queryHash = this.cacheManager.generateQueryHash(this.query, this.params);
      const cachedResult = this.cacheManager.getQueryCacheEntry(queryHash);
      if (cachedResult !== null) {
        // Reset query state and return cached result
        this.params = [];
        this.hasLimit1 = false;
        return cachedResult;
      }
    }

    const results = await runQueryAsync(this.query, this.params);
    
    // Store original state for caching
    const wasLimit1 = this.hasLimit1;
    const queryHash = wasLimit1 ? this.cacheManager.generateQueryHash(this.query, this.params) : '';
    
    // Reset query state
    this.params = [];
    this.hasLimit1 = false;
    
    if (!results) 
      return [];
    
    // Deserialize MultiLingualString and JSON fields
    const deserializedResults = DatabaseHelper.processResultsFromDatabase(results);
    
    // Cache LIMIT 1 query results
    if (wasLimit1 && deserializedResults.length > 0) {
      this.cacheManager.setQueryCacheEntry(queryHash, deserializedResults);
      
      // Also cache by ID if the result has an ID
      const firstResult = deserializedResults[0] as Model;
      if (firstResult.Id) {
        this.cacheManager.setCacheEntry(firstResult.Id, firstResult);
      }
    }
    
    return deserializedResults as Model[];
  }

  public async CallStoredProcedure(procedure: StoredProcedureEnum, params: any[] = []): Promise<Model[]> {
    const results = await RepositoryUtils.CallStoredProcedureGeneric(procedure, params);
    return results as Model[];
  }

  public async Save(entity: Partial<SaveModel>): Promise<Model> {
    // Serialize MultiLingualString and JSON fields before saving
    const serializedEntity = DatabaseHelper.processEntityForDatabase(entity);
    
    if (serializedEntity.Id) {
      // UPDATE - invalidate cache for this ID and all query cache
      this.cacheManager.invalidateCache(serializedEntity.Id);
      this.cacheManager.invalidateAllQueryCache();
      
      // UPDATE
      const setClause = Object.keys(serializedEntity)
        .filter(key => key !== 'Id')
        .map(key => `${key} = ?`)
        .join(', ');

      const query = `UPDATE ${this.table} SET ${setClause} WHERE Id = ?`;
      const params = [...Object.values(serializedEntity).filter((_, index) => Object.keys(serializedEntity)[index] !== 'Id'), serializedEntity.Id];

      // Run the update
      await runQueryAsync(query, params);

      const result = await this.Select().Where({ Id: serializedEntity.Id }).Execute();
      if (result?.length === 0)
        throw new Error('Record not found');
      
      const savedRecord = result?.[0] as Model;
      // Update cache with fresh data
      this.cacheManager.setCacheEntry(serializedEntity.Id, savedRecord);
      return savedRecord;
    } else {
      // INSERT - invalidate all query cache
      this.cacheManager.invalidateAllQueryCache();
      
      // INSERT
      const keys = Object.keys(serializedEntity).join(', ');
      const values = Object.values(serializedEntity)
        .map(() => '?')
        .join(', ');

      const query = `INSERT INTO ${this.table} (${keys}) VALUES (${values})`;
      const params = Object.values(serializedEntity);

      await runQueryAsync(query, params);
      
      const result = await this.Select().OrderBy('Id', 'DESC').Limit(1).Execute();
      if (result?.length === 0)
        throw new Error('Record not found');
      
      const savedRecord = result?.[0] as Model;
      // Cache the new record
      if (savedRecord.Id) {
        this.cacheManager.setCacheEntry(savedRecord.Id, savedRecord);
      }
      return savedRecord;
    }
  }

  public async Delete(id: number): Promise<void> {
    // Invalidate cache before deletion
    this.cacheManager.invalidateCache(id);
    this.cacheManager.invalidateAllQueryCache();
    
    const query = `DELETE FROM ${this.table} WHERE Id = ?`;
    const params = [id];
    await runQueryAsync(query, params);
  }

  // Utility method to get cache statistics
  public getCacheStats(): { idCacheSize: number; queryCacheSize: number } {
    return this.cacheManager.getCacheStats();
  }

  // Utility method to clear all cache
  public clearCache(): void {
    this.cacheManager.clearAllCache();
  }
}

export default BaseRepository;

export class RepositoryUtils {

  public static async CallStoredProcedureGeneric(procedure: StoredProcedureEnum, params: any[] = []): Promise<any[]> {
    const procedureName = procedure.toString();
    const query = `CALL ${procedureName}(${params.map(() => '?').join(', ')})`;
    const results = await runQueryAsync(query, params);
    
    if (!results || !results[0]) 
      return [];
    
    // Transform database keys to PascalCase and deserialize MultiLingualString and JSON fields
    const transformedResults = DatabaseHelper.processStoredProcedureResults(results);
    
    return transformedResults;
  }

  public static async CallFunctionGeneric<T = any>(fn: FunctionEnum, params: any[] = []): Promise<T | undefined> {
    const functionName = fn.toString();
    const placeholders = params.map(() => '?').join(', ');
    const query = `SELECT ${functionName}(${placeholders}) AS Result`;
    const results = await runQueryAsync(query, params);

    if (!results || results.length === 0) 
      return undefined;

    const row: any = results[0];
    const result = row?.Result;
    if(result)
      return result.toString() as T;
    throw new Error(`Function ${functionName} returned an invalid result`);
  }
}
