import { TableEnum, StoredProcedureEnum, ExceptionEnum } from "../interfaces/enums/index";
import { MetadataKeyEnum } from "../interfaces/enums/application/MetadataKeyEnum";
import { getEnumProperty } from "../utils/helpers/EnumMetadata";
import { FunctionEnum } from "../interfaces/enums/database/FunctionEnum";
import { getTableName, runExecuteAsync, runQueryAsync } from "./util/ConnectionHandler";
import { DatabaseHelper } from "../utils/database/DatabaseHelper";
import { CacheManager } from "./util/CacheManager";
import { QueryBuilder } from "./util/QueryBuilder";
import { isValidEnumValue } from "../utils/helpers/Enum";
import { ErrorHelper } from "../utils/application/Error";
import { BaseEntity, BaseEntityFieldType } from "../interfaces/database/BaseEntity";

class BaseRepository<Model extends BaseEntity, SaveModel extends BaseEntity, FieldEnum extends Record<string, string>> {
  public readonly tableEnum: TableEnum;
  protected fieldEnum: FieldEnum;
  protected fieldTypeFunction: (field: FieldEnum[keyof FieldEnum]) => BaseEntityFieldType;
  protected table: string;
  protected cacheManager: CacheManager<Model>;

  constructor(table: TableEnum, fieldEnum: FieldEnum, fieldTypeFunction: (field: FieldEnum[keyof FieldEnum]) => BaseEntityFieldType) {
    this.tableEnum = table;
    this.fieldEnum = fieldEnum;
    this.fieldTypeFunction = fieldTypeFunction;
    this.table = getTableName(table);
    this.cacheManager = new CacheManager<Model>(this.table);
  }

  public getFieldEnum(): Record<string, string> {
    return this.fieldEnum;
  }

  public async getById(id: number): Promise<Model | null> {
    // Check cache first
    const cached = this.cacheManager.getCacheEntry(id);
    if (cached)
      return cached;

    // Fetch from database
    const results = await this.Select().Where({ Id: id }).Limit(1).Execute();
    const result = results?.[0] || null;

    // Cache the result if found
    if (result)
      this.cacheManager.setCacheEntry(id, result);

    return result;
  }

  public Select(fields: (keyof Model)[] = ['*'] as (keyof Model)[]): QueryBuilder<Model, FieldEnum> {
    return new QueryBuilder<Model, FieldEnum>(
      { table: this.table, cacheManager: this.cacheManager, fieldEnum: this.fieldEnum, fieldTypeFunction: this.fieldTypeFunction },
      fields,
    );
  }

  public async CallStoredProcedure(procedure: StoredProcedureEnum, params: any[] = []): Promise<Model[]> {
    const results = await RepositoryUtils.CallStoredProcedureGeneric(procedure, params, this.fieldEnum, this.fieldTypeFunction);
    return results as Model[];
  }

  public async Save(entity: Partial<SaveModel>): Promise<Model> {
    // Serialize MultiLingualString and JSON fields before saving
    const serializedEntity = DatabaseHelper.processEntityForDatabase(entity, this.fieldEnum, this.fieldTypeFunction);

    if (serializedEntity.Id) {
      // Capture cached entry before invalidating query caches so we can merge
      const cachedBefore = this.cacheManager.getCacheEntry(serializedEntity.Id);

      // Query-by-hash cache must always be dropped; the row cache is updated below
      this.cacheManager.invalidateAllQueryCache();

      if (isValidEnumValue(this.fieldEnum, 'UpdatedAt'))
        serializedEntity.UpdatedAt = new Date();

      // UPDATE - only include fields that are explicitly set (not undefined)
      const fieldsToUpdate: string[] = [];
      const valuesToUpdate: any[] = [];

      for (const [key, value] of Object.entries(serializedEntity)) {
        if (key !== 'Id' && value !== undefined) {
          fieldsToUpdate.push(key);
          valuesToUpdate.push(value);
        }
      }

      if (fieldsToUpdate.length === 0) {
        // No fields to update, just return the existing record
        this.cacheManager.invalidateCache(serializedEntity.Id);
        const result = await this.Select().Where({ Id: serializedEntity.Id }).Execute();
        if (result.length === 0)
          ErrorHelper.throw(ExceptionEnum.RECORD_NOT_FOUND);
        return result[0] as Model;
      }

      const setClause = fieldsToUpdate.map(key => `${key} = ?`).join(', ');
      const query = `UPDATE ${this.table} SET ${setClause} WHERE Id = ?`;
      const params = [...valuesToUpdate, serializedEntity.Id];

      // Run the update (single statement → execute() for prepared-statement caching)
      await runExecuteAsync(query, params);

      // Hot path: cached entry exists → merge known new values, skip the SELECT round-trip.
      // Merge uses the caller-supplied deserialized `entity` (not `serializedEntity`) so
      // MultiLingualString / JSON fields stay as objects, matching the cache shape.
      if (cachedBefore) {
        const mergedFields: Partial<Model> = {};
        for (const [key, value] of Object.entries(entity)) {
          if (value !== undefined)
            (mergedFields as any)[key] = value;
        }
        if (isValidEnumValue(this.fieldEnum, 'UpdatedAt'))
          (mergedFields as any).UpdatedAt = serializedEntity.UpdatedAt;
        const merged = { ...cachedBefore, ...mergedFields } as Model;
        this.cacheManager.setCacheEntry(serializedEntity.Id, merged);
        return merged;
      }

      // Cold-cache fallback: read the canonical row back
      this.cacheManager.invalidateCache(serializedEntity.Id);
      const result = await this.Select().Where({ Id: serializedEntity.Id }).Execute();
      if (result?.length === 0)
        ErrorHelper.throw(ExceptionEnum.RECORD_NOT_FOUND);

      const savedRecord = result?.[0] as Model;
      this.cacheManager.setCacheEntry(serializedEntity.Id, savedRecord);
      return savedRecord;
    } else {
      // INSERT - invalidate all query cache and external ID list cache
      this.cacheManager.invalidateAllQueryCache();
      this.cacheManager.invalidateExternalIdCache();

      if (isValidEnumValue(this.fieldEnum, 'CreatedAt'))
        serializedEntity.CreatedAt = new Date();

      // INSERT
      const keys = Object.keys(serializedEntity).join(', ');
      const values = Object.values(serializedEntity)
        .map(() => '?')
        .join(', ');

      const query = `INSERT INTO ${this.table} (${keys}) VALUES (${values}); SELECT * FROM ${this.table} WHERE Id = LAST_INSERT_ID()`;
      const params = Object.values(serializedEntity);

      const results = await runQueryAsync(query, params);
      if (!results)
        ErrorHelper.throw(ExceptionEnum.RECORD_NOT_FOUND);
      
      const selectResults = Array.isArray(results) && results.length > 0 && Array.isArray(results[results.length - 1]) 
        ? results[results.length - 1] 
        : results;
      if (!selectResults || selectResults.length === 0)
        ErrorHelper.throw(ExceptionEnum.RECORD_NOT_FOUND);

      const savedRecord = DatabaseHelper.processResultsFromDatabase(selectResults, this.fieldEnum, this.fieldTypeFunction)[0] as Model;
      // Cache the new record
      if (savedRecord.Id)
        this.cacheManager.setCacheEntry(savedRecord.Id, savedRecord);
      
      return savedRecord;
    }
  }

  public async Delete(id: number): Promise<void> {
    // Invalidate cache before deletion
    this.cacheManager.invalidateCache(id);
    this.cacheManager.invalidateAllQueryCache();
    this.cacheManager.invalidateExternalIdCache();

    const query = `DELETE FROM ${this.table} WHERE Id = ?`;
    const params = [id];
    await runExecuteAsync(query, params);
  }

  public async getExternalIdsAsync(): Promise<string[]> {
    const cached = this.cacheManager.getExternalIdCache();
    if (cached !== null) 
      return cached;

    const externalIdField = getEnumProperty(TableEnum, this.tableEnum, MetadataKeyEnum.ExternalIdField);
    if (!externalIdField) 
      return [];

    const fieldName = String(externalIdField);
    const results = await runExecuteAsync(`SELECT ${fieldName} FROM ${this.table}`, []);

    if (!results || results.length === 0) {
      this.cacheManager.setExternalIdCache([]);
      return [];
    }

    const lowerField = fieldName.toLowerCase();
    const ids = (results as Array<Record<string, unknown>>)
      .map(row => String(row[fieldName] ?? row[lowerField] ?? ''))
      .filter(Boolean);

    this.cacheManager.setExternalIdCache(ids);
    return ids;
  }

  public getCacheStats(): { idCacheSize: number; queryCacheSize: number; externalIdCacheSize: number } {
    return this.cacheManager.getCacheStats();
  }

  public clearCache(): void {
    this.cacheManager.clearAllCache();
  }
}

export default BaseRepository;

export class RepositoryUtils {

  public static async CallStoredProcedureGeneric<FieldEnum extends Record<string, string> = Record<string, string>>(procedure: StoredProcedureEnum, params: any[] = [], fieldEnum?: FieldEnum, fieldTypeFunction?: (field: FieldEnum[keyof FieldEnum]) => BaseEntityFieldType): Promise<any[]> {
    const procedureName = procedure.toString();
    const query = `CALL ${procedureName}(${params.map(() => '?').join(', ')})`;
    const results = await runExecuteAsync(query, params);

    if (!results || !results[0])
      return [];

    // Transform database keys to PascalCase and deserialize MultiLingualString and JSON fields
    const transformedResults = DatabaseHelper.processStoredProcedureResults(results, fieldEnum, fieldTypeFunction);

    return transformedResults;
  }

  public static async CallFunctionGeneric<T = any>(fn: FunctionEnum, params: any[] = []): Promise<T | undefined> {
    const functionName = fn.toString();
    const placeholders = params.map(() => '?').join(', ');
    const query = `SELECT ${functionName}(${placeholders}) AS Result`;
    const results = await runExecuteAsync(query, params);

    if (!results || results.length === 0)
      return undefined;

    const row: any = results[0];
    const result = row?.Result;
    if (result)
      return result.toString() as T;
    ErrorHelper.throwWithParameters(ExceptionEnum.FUNCTION_RETURNED_INVALID_RESULT, { functionName: functionName.toString() });
  }
}
