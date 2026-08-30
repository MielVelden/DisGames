import { CacheManager } from "./CacheManager";
import { DatabaseHelper } from "../../utils/database/DatabaseHelper";
import { runExecuteAsync } from "./ConnectionHandler";
import { BaseEntity, BaseEntityFieldType } from "../../interfaces/database/BaseEntity";

type ComparisonOperator = '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'NOT LIKE';
type WhereCondition<T> = {
  [K in keyof T]?: { operator: ComparisonOperator; value: T[K] } | T[K];
};

export interface QueryBuilderContext<Model extends BaseEntity, FieldEnum extends Record<string, string>> {
  table: string;
  cacheManager: CacheManager<Model>;
  fieldEnum: FieldEnum;
  fieldTypeFunction: (field: FieldEnum[keyof FieldEnum]) => BaseEntityFieldType;
}

export class QueryBuilder<Model extends BaseEntity, FieldEnum extends Record<string, string>> {
  private query: string;
  private params: any[] = [];
  private hasLimit1 = false;

  constructor(private readonly ctx: QueryBuilderContext<Model, FieldEnum>, fields: (keyof Model)[]) {
    this.query = `SELECT ${fields.join(', ')} FROM ${ctx.table}`;
  }

  public Where<K extends keyof Model>(condition: Partial<Record<K, Model[K]>> | WhereCondition<Model>): this {
    const conditions: string[] = [];
    const values: any[] = [];

    Object.entries(condition).forEach(([key, value]) => {
      if (value && typeof value === 'object' && 'operator' in value && 'value' in value) {
        conditions.push(`${key} ${value.operator} ?`);
        values.push(value.value);
      } else {
        conditions.push(`${key} = ?`);
        values.push(value);
      }
    });

    this.query += ` WHERE ${conditions.join(' AND ')}`;
    this.params.push(...values);

    return this;
  }

  public WhereRaw(condition: string, params: any[] = []): this {
    if (this.query.includes(' WHERE ')) {
      this.query += ` AND (${condition})`;
    } else {
      this.query += ` WHERE (${condition})`;
    }
    this.params.push(...params);
    return this;
  }

  public GroupBy<K extends keyof Model>(fields: K[]): this {
    const conditions = fields.map((field) => `${String(field)}`).join(', ');

    this.query += ` GROUP BY ${conditions}`;
    return this;
  }

  public OrderBy<K extends keyof Model>(field: K, direction: 'ASC' | 'DESC' = 'ASC'): this {
    this.query += ` ORDER BY ${String(field)} ${direction}`;
    return this;
  }

  public OrderByRandom(): this {
    this.query += ` ORDER BY RAND()`;
    return this;
  }

  public async Count(): Promise<number> {
    this.query = this.query.replace(/^SELECT .+ FROM/, 'SELECT COUNT(*) as Total FROM');
    this.hasLimit1 = true;

    const results = await this.Execute();

    if (!results || results.length === 0)
      return 0;

    return (results[0] as unknown as { Total: number }).Total as number;
  }

  public async Sum(field: keyof Model): Promise<number> {
    this.query = this.query.replace(/^SELECT .+ FROM/, `SELECT SUM(${String(field)}) as Total FROM`);
    this.hasLimit1 = true;

    const results = await this.Execute();

    if (!results || results.length === 0)
      return 0;

    return (results[0] as unknown as { Total: number }).Total as number;
  }

  public Limit(count: number): this {
    this.query += ` LIMIT ?`;
    this.params.push(count);

    if (count === 1) {
      this.hasLimit1 = true;
    }

    return this;
  }

  public Offset(count: number): this {
    this.query += ` OFFSET ?`;
    this.params.push(count);
    return this;
  }

  public async Execute(): Promise<Model[]> {
    const { cacheManager, fieldEnum, fieldTypeFunction } = this.ctx;

    // Check query cache for LIMIT 1 queries
    if (this.hasLimit1) {
      const queryHash = cacheManager.generateQueryHash(this.query, this.params);
      const cachedResult = cacheManager.getQueryCacheEntry(queryHash);
      if (cachedResult !== null)
        return cachedResult;

      // Check if query is already in-flight
      const inFlightQuery = cacheManager.getInFlightQuery(queryHash);
      if (inFlightQuery)
        return await inFlightQuery;

      // Create and register in-flight promise
      const queryPromise = this.executeQueryAndCache(queryHash, fieldEnum, fieldTypeFunction);
      cacheManager.setInFlightQuery(queryHash, queryPromise);

      return await queryPromise;
    }

    // Non-cached query path
    const results = await runExecuteAsync(this.query, this.params);

    if (!results)
      return [];

    return DatabaseHelper.processResultsFromDatabase(results, fieldEnum, fieldTypeFunction) as Model[];
  }

  private async executeQueryAndCache(
    queryHash: string,
    fieldEnum: FieldEnum,
    fieldTypeFunction: (field: FieldEnum[keyof FieldEnum]) => BaseEntityFieldType,
  ): Promise<Model[]> {
    const { cacheManager } = this.ctx;
    try {
      const results = await runExecuteAsync(this.query, this.params);

      if (!results || results.length === 0) {
        return [];
      }

      // Deserialize MultiLingualString and JSON fields
      const deserializedResults = DatabaseHelper.processResultsFromDatabase(results, fieldEnum, fieldTypeFunction) as Model[];

      // Cache the results
      cacheManager.setQueryCacheEntry(queryHash, deserializedResults);

      // Also cache by ID if the result has an ID
      const firstResult = deserializedResults[0];
      if (firstResult.Id) {
        cacheManager.setCacheEntry(firstResult.Id, firstResult);
      }

      return deserializedResults;
    } finally {
      // Always remove from in-flight map when done
      cacheManager.removeInFlightQuery(queryHash);
    }
  }
}

export type { ComparisonOperator, WhereCondition };
